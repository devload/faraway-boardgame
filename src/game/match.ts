import type {
  MatchState,
  PlayerId,
  PlayerState,
  RegionCard,
  SanctuaryCard,
} from './types.ts'
import { REGION_CARDS } from './cards.ts'
import { SANCTUARY_CARDS } from './sanctuaries.ts'
import { mulberry32, shuffle } from './rng.ts'
import { pickBotCard } from './bots.ts'
import { buildCtx, scorePlayer } from './scoring.ts'

/**
 * Round loop (Faraway original — condensed):
 *
 *   Phase 1 · Exploring
 *     Each player picks 1 region from their 3-card hand, plays it face-down,
 *     both flip simultaneously and append it to the RIGHT of their tableau.
 *
 *   Phase 2 · Finding Sanctuaries
 *     Any player whose newly-played number is STRICTLY GREATER than their
 *     previous card discovers sanctuaries: they draw (1 + clueCount) cards
 *     from the top of the sanctuary deck into a private "choices" pool.
 *     Rounds 1: no previous card, so nobody discovers.
 *
 *   Phase 3 · End of Exploration ("draft")
 *     In order LOWEST → HIGHEST played card, each player:
 *       (a) takes one region from the central market (unless R8 — no draft)
 *           and restores their hand to 3
 *       (b) if they have sanctuary choices, keeps EXACTLY ONE and returns
 *           the rest to the BOTTOM of the sanctuary deck.
 *
 *   Round cleanup
 *     Remove the leftover market card, refill market to (players+1),
 *     advance round or end at round 8.
 *
 * Round 8 special: no new region enters play, but the sanctuary
 * mini-flow (find + keep) still runs. This lets a big number 8 give one
 * last sanctuary grab.
 */

export const TOTAL_ROUNDS = 8
const HAND_SIZE = 3
// 1 player + 1 bot → market size 2+1 = 3 (rulebook: N+1 where N = players).
const MARKET_SIZE = 3
/** Clues supplied by cards printed on the player's tableau itself. */
function tableauClueCount(player: PlayerState): number {
  return player.tableau.reduce((s, c) => s + c.clues, 0)
    + player.sanctuaries.reduce((s, c) => s + c.clues, 0)
}

export function initMatch(seed: number): MatchState {
  const rand = mulberry32(seed >>> 0)

  const regionShuffled = shuffle(REGION_CARDS, rand)
  const sanctuaryShuffled = shuffle(SANCTUARY_CARDS, rand)

  const humanHand = regionShuffled.slice(0, HAND_SIZE)
  const botHand   = regionShuffled.slice(HAND_SIZE, HAND_SIZE * 2)
  const regionMarket = regionShuffled.slice(HAND_SIZE * 2, HAND_SIZE * 2 + MARKET_SIZE)
  const regionDeck   = regionShuffled.slice(HAND_SIZE * 2 + MARKET_SIZE)

  return {
    round: 1,
    players: {
      human: mkPlayer('human', 'YOU', '👤', humanHand),
      bot:   mkPlayer('bot',   '유령 사냥꾼', '🥷', botHand),
    },
    regionMarket,
    regionDeck,
    sanctuaryDeck: sanctuaryShuffled,
    phase: 'explore',
    selections: { human: null, bot: null },
    drawOrder: [],
    drawIndex: 0,
    seed,
  }
}

function mkPlayer(id: PlayerId, name: string, icon: string, hand: RegionCard[]): PlayerState {
  return { id, name, icon, hand, tableau: [], sanctuaries: [], sanctuaryChoices: [] }
}

// ═════════════════════════════════════════════════════════════════════
// Phase 1 · Explore
// ═════════════════════════════════════════════════════════════════════

/** Human clicks a card in hand — record their pick. */
export function selectCard(state: MatchState, playerId: PlayerId, card: RegionCard): MatchState {
  if (state.phase !== 'explore') return state
  if (state.selections[playerId] !== null) return state
  if (!state.players[playerId].hand.some((c) => c.id === card.id)) return state
  return { ...state, selections: { ...state.selections, [playerId]: card } }
}

/** Auto-fill the bot's selection once the human has committed. */
export function fillBotSelection(state: MatchState): MatchState {
  if (state.phase !== 'explore') return state
  if (state.selections.bot !== null) return state
  const chosen = pickBotCard(state.players.bot, state)
  return { ...state, selections: { ...state.selections, bot: chosen } }
}

// ═════════════════════════════════════════════════════════════════════
// Phase 2 · Reveal + Find Sanctuaries
// ═════════════════════════════════════════════════════════════════════

/**
 * Both selections in →
 *   • append cards to tableaux (removed from hands)
 *   • compute draw order (lowest number first)
 *   • deal sanctuary choices for players who ascended
 *   • advance to draft phase
 *
 * Note the sanctuary deal happens IN draw order so that if the deck
 * runs thin the earlier player gets first pick.
 */
export function revealAndFindSanctuaries(state: MatchState): MatchState {
  if (state.phase !== 'explore') return state
  const humanPlay = state.selections.human
  const botPlay = state.selections.bot
  if (!humanPlay || !botPlay) return state

  // Place cards.
  const newHuman: PlayerState = {
    ...state.players.human,
    hand: state.players.human.hand.filter((c) => c.id !== humanPlay.id),
    tableau: [...state.players.human.tableau, humanPlay],
    sanctuaryChoices: [],   // reset — will refill below if eligible
  }
  const newBot: PlayerState = {
    ...state.players.bot,
    hand: state.players.bot.hand.filter((c) => c.id !== botPlay.id),
    tableau: [...state.players.bot.tableau, botPlay],
    sanctuaryChoices: [],
  }

  // Draw order: lowest played number goes first (tiebreak: human).
  const drawOrder: PlayerId[] = humanPlay.id <= botPlay.id ? ['human', 'bot'] : ['bot', 'human']

  // Deal sanctuaries in draw order.
  let deck = state.sanctuaryDeck
  const playersById = { human: newHuman, bot: newBot }
  for (const pid of drawOrder) {
    const player = playersById[pid]
    if (!isAscending(player)) continue        // no sanctuary this round
    const drawSize = 1 + tableauClueCount(player)
    const drawn = deck.slice(0, drawSize)
    deck = deck.slice(drawSize)
    playersById[pid] = { ...player, sanctuaryChoices: drawn }
  }

  return {
    ...state,
    players: playersById,
    sanctuaryDeck: deck,
    phase: 'draft',
    drawOrder,
    drawIndex: 0,
  }
}

/**
 * A player "ascends" (gets sanctuary access this round) if their just-
 * played card has a strictly greater number than their previous card.
 * Round 1: no previous card — rule says NO sanctuary that round.
 */
export function isAscending(player: PlayerState): boolean {
  const tab = player.tableau
  if (tab.length < 2) return false            // round 1 or malformed
  return tab[tab.length - 1]!.id > tab[tab.length - 2]!.id
}

// ═════════════════════════════════════════════════════════════════════
// Phase 3 · Draft
// ═════════════════════════════════════════════════════════════════════

/**
 * Take the drafting player's End-of-Exploration turn.
 *
 * Round 8: regionPick is ignored — no new region is added to the tableau.
 *          Only the sanctuary choice resolves.
 *
 * sanctuaryPickId:
 *   - number: keep that sanctuary, return the rest to the bottom of deck
 *   - null:   keep none, return all choices to the bottom of deck
 *   (No-op if the player had no choices.)
 */
export function takeDraft(
  state: MatchState,
  playerId: PlayerId,
  regionPick: RegionCard | null,
  sanctuaryPickId: number | null,
): MatchState {
  if (state.phase !== 'draft') return state
  if (state.drawOrder[state.drawIndex] !== playerId) return state

  const player = state.players[playerId]

  let newRegionMarket = state.regionMarket
  let newHand = player.hand
  const isLastRound = state.round >= TOTAL_ROUNDS

  if (!isLastRound) {
    if (!regionPick) return state
    const marketHasPick = state.regionMarket.some((c) => c.id === regionPick.id)
    if (!marketHasPick) return state
    newRegionMarket = state.regionMarket.filter((c) => c.id !== regionPick.id)
    newHand = [...player.hand, regionPick]
  }

  // Resolve sanctuary choice.
  let newSanctuaries = player.sanctuaries
  let newDeck = state.sanctuaryDeck
  if (player.sanctuaryChoices.length > 0) {
    const kept = sanctuaryPickId !== null
      ? player.sanctuaryChoices.find((s) => s.id === sanctuaryPickId) ?? null
      : null
    const returned: SanctuaryCard[] = player.sanctuaryChoices.filter((s) => s.id !== kept?.id)
    if (kept) newSanctuaries = [...player.sanctuaries, kept]
    // Returned cards go to the BOTTOM of the deck.
    newDeck = [...newDeck, ...returned]
  }

  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        hand: newHand,
        sanctuaries: newSanctuaries,
        sanctuaryChoices: [],
      },
    },
    regionMarket: newRegionMarket,
    sanctuaryDeck: newDeck,
    drawIndex: state.drawIndex + 1,
  }
}

/**
 * Simple bot draft:
 *   Region — highest-points card in the market (skip on R8).
 *   Sanctuary — pick the choice with best (topScore + bottomScore) evaluated
 *   against the bot's current tableau + sanctuaries.
 */
export function botDraft(state: MatchState): MatchState {
  if (state.phase !== 'draft') return state
  if (state.drawOrder[state.drawIndex] !== 'bot') return state

  const isLastRound = state.round >= TOTAL_ROUNDS
  const bot = state.players.bot

  const regionPick = isLastRound
    ? null
    : [...state.regionMarket].sort((a, b) => b.points - a.points)[0] ?? null

  let sanctPickId: number | null = null
  if (bot.sanctuaryChoices.length > 0) {
    // Score each candidate holistically: pretend the bot took THIS
    // sanctuary + kept everything else, then run full scoring — this
    // way the bot correctly values gate-opener sanctuaries whose
    // supplies unlock previously-failing region quests.
    const baselineScore = scorePlayer('bot', bot.tableau, bot.sanctuaries).total
    let bestDelta = -Infinity
    let best: SanctuaryCard | null = null
    for (const cand of bot.sanctuaryChoices) {
      const hypothetical = [...bot.sanctuaries, cand]
      const ctx = buildCtx(bot.tableau, hypothetical)
      // Direct top+bottom score for THIS card, plus any region-quest
      // deltas its `supplies` may unlock, plus a small clue bonus for
      // future rounds.
      const own = cand.topScoreFn(ctx) + cand.bottomScoreFn(ctx)
      const hypoTotal = scorePlayer('bot', bot.tableau, hypothetical).total
      const regionDelta = (hypoTotal - own) - baselineScore
      const score = own + regionDelta + cand.clues * 2
      if (score > bestDelta) {
        bestDelta = score
        best = cand
      }
    }
    sanctPickId = best?.id ?? bot.sanctuaryChoices[0]!.id
  }

  return takeDraft(state, 'bot', regionPick, sanctPickId)
}

/**
 * Cleanup between rounds:
 *   • On R<8: discard leftover market card, refill market to MARKET_SIZE.
 *   • On R8: skip refill; jump to end phase for scoring.
 */
export function endRound(state: MatchState): MatchState {
  const isLastRound = state.round >= TOTAL_ROUNDS
  if (isLastRound) {
    return { ...state, phase: 'end' }
  }

  // Discard the market card left behind and refill from deck.
  // The rules say "remove the leftover Region cards" — with 2 players we
  // start each End-of-Exploration with 3 in market, 2 get drafted, 1 is
  // left; that one goes to the discard pile (we just drop it).
  const drainedMarket: RegionCard[] = []
  const needed = MARKET_SIZE - drainedMarket.length
  const drawn = state.regionDeck.slice(0, needed)
  const newMarket = [...drainedMarket, ...drawn]
  const newDeck = state.regionDeck.slice(needed)

  return {
    ...state,
    round: state.round + 1,
    phase: 'explore',
    regionMarket: newMarket,
    regionDeck: newDeck,
    selections: { human: null, bot: null },
    drawOrder: [],
    drawIndex: 0,
  }
}

// ═════════════════════════════════════════════════════════════════════
// Queries used by the UI
// ═════════════════════════════════════════════════════════════════════

export function isDraftPhaseComplete(state: MatchState): boolean {
  return state.phase === 'draft' && state.drawIndex >= state.drawOrder.length
}

export function currentDrafter(state: MatchState): PlayerId | null {
  if (state.phase !== 'draft') return null
  return state.drawOrder[state.drawIndex] ?? null
}

/**
 * Backwards-compatible alias — old scenes / stores called this to check
 * sanctuary eligibility. Now it just wraps isAscending against the
 * player's current tableau.
 */
export function hasSanctuaryAccess(state: MatchState, playerId: PlayerId): boolean {
  return isAscending(state.players[playerId])
}

/** Kept for any legacy callers; delegates to the new names. */
export const revealAndPlace = revealAndFindSanctuaries
export const currentDrawer = currentDrafter
export const isDrawPhaseComplete = isDraftPhaseComplete

/** Convenience: number of sanctuary cards a player would draw right now. */
export function sanctuaryDrawSize(state: MatchState, playerId: PlayerId): number {
  return 1 + tableauClueCount(state.players[playerId])
}
