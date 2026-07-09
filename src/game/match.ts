import type {
  MatchState,
  PlayerId,
  RegionCard,
} from './types.ts'
import { REGION_CARDS } from './cards.ts'
import { SANCTUARY_CARDS } from './sanctuaries.ts'
import { mulberry32, shuffle } from './rng.ts'
import { pickBotCard } from './bots.ts'

const TOTAL_ROUNDS = 8

/** Fresh match state. Human always goes as `human`, bot as `bot`. */
export function initMatch(seed: number): MatchState {
  const rand = mulberry32(seed >>> 0)

  // Shuffle both decks. Some cards start in players' hands and markets.
  const regionShuffled = shuffle(REGION_CARDS, rand)
  const sanctuaryShuffled = shuffle(SANCTUARY_CARDS, rand)

  // Deal 3 to each player, then 3 face-up regions to the market.
  const humanHand = regionShuffled.slice(0, 3)
  const botHand   = regionShuffled.slice(3, 6)
  const regionMarket = regionShuffled.slice(6, 9)
  const regionDeck   = regionShuffled.slice(9)

  // 3 sanctuaries face-up in the sanctuary market.
  const sanctuaryMarket = sanctuaryShuffled.slice(0, 3)
  const sanctuaryDeck   = sanctuaryShuffled.slice(3)

  return {
    round: 1,
    players: {
      human: { id: 'human', name: 'YOU',   icon: '👤', hand: humanHand, tableau: [], sanctuaries: [] },
      bot:   { id: 'bot',   name: '유령 사냥꾼', icon: '🥷', hand: botHand,   tableau: [], sanctuaries: [] },
    },
    regionMarket,
    regionDeck,
    sanctuaryMarket,
    sanctuaryDeck,
    phase: 'select',
    selections: { human: null, bot: null },
    drawOrder: [],
    drawIndex: 0,
    seed,
  }
}

/** Human clicks a card in hand — record their pick. */
export function selectCard(state: MatchState, playerId: PlayerId, card: RegionCard): MatchState {
  if (state.phase !== 'select') return state
  if (state.selections[playerId] !== null) return state
  // Card must be in player's hand.
  if (!state.players[playerId].hand.some((c) => c.id === card.id)) return state
  return {
    ...state,
    selections: { ...state.selections, [playerId]: card },
  }
}

/**
 * When human has selected, we auto-fill the bot's selection so the round
 * can resolve. The bot decision is made by pickBotCard.
 */
export function fillBotSelection(state: MatchState): MatchState {
  if (state.phase !== 'select') return state
  if (state.selections.bot !== null) return state
  const bot = state.players.bot
  const chosen = pickBotCard(bot, state)
  return {
    ...state,
    selections: { ...state.selections, bot: chosen },
  }
}

/** Both selections in → place cards, compute draw order, advance to draw phase. */
export function revealAndPlace(state: MatchState): MatchState {
  if (state.phase !== 'select') return state
  const { human, bot } = state.selections
  if (!human || !bot) return state

  // Remove played cards from hands and append to tableaux.
  const newHuman = {
    ...state.players.human,
    hand: state.players.human.hand.filter((c) => c.id !== human.id),
    tableau: [...state.players.human.tableau, human],
  }
  const newBot = {
    ...state.players.bot,
    hand: state.players.bot.hand.filter((c) => c.id !== bot.id),
    tableau: [...state.players.bot.tableau, bot],
  }

  // Draw order: lower number goes first.
  const drawOrder: PlayerId[] = human.id <= bot.id ? ['human', 'bot'] : ['bot', 'human']

  return {
    ...state,
    players: { ...state.players, human: newHuman, bot: newBot },
    phase: 'draw',
    drawOrder,
    drawIndex: 0,
  }
}

/**
 * Does this player have sanctuary access this round?
 * True iff the card they just played has a number strictly greater than
 * the card they played in the immediately previous round.
 */
export function hasSanctuaryAccess(state: MatchState, playerId: PlayerId): boolean {
  const tab = state.players[playerId].tableau
  if (tab.length < 2) {
    // Round 1 (only 1 card played so far) — original rule grants sanctuary
    // access when there's no previous card, so we say yes.
    return tab.length === 1
  }
  const played = tab[tab.length - 1]!
  const prev   = tab[tab.length - 2]!
  return played.id > prev.id
}

/** Player takes their draw action: 1 region card + (if allowed) 1 sanctuary. */
export function takeDraw(
  state: MatchState,
  playerId: PlayerId,
  regionPick: RegionCard,
  sanctuaryPickId: number | null,
): MatchState {
  if (state.phase !== 'draw') return state
  if (state.drawOrder[state.drawIndex] !== playerId) return state

  // Validate the region pick is in market.
  const marketHasPick = state.regionMarket.some((c) => c.id === regionPick.id)
  if (!marketHasPick) return state

  // Remove picked region from market; add to hand.
  const newMarket = state.regionMarket.filter((c) => c.id !== regionPick.id)
  const player = state.players[playerId]
  const newHand = [...player.hand, regionPick]

  // Sanctuary handling.
  let newSanctuaries = player.sanctuaries
  let newSanctuaryMarket = state.sanctuaryMarket
  if (sanctuaryPickId !== null && hasSanctuaryAccess(state, playerId)) {
    const sanct = state.sanctuaryMarket.find((s) => s.id === sanctuaryPickId)
    if (sanct) {
      newSanctuaries = [...player.sanctuaries, sanct]
      newSanctuaryMarket = state.sanctuaryMarket.filter((s) => s.id !== sanctuaryPickId)
    }
  }

  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        hand: newHand,
        sanctuaries: newSanctuaries,
      },
    },
    regionMarket: newMarket,
    sanctuaryMarket: newSanctuaryMarket,
    drawIndex: state.drawIndex + 1,
  }
}

/** Simple bot draw: picks the highest-points region card in the market. */
export function botDraw(state: MatchState): MatchState {
  const best = [...state.regionMarket].sort((a, b) => b.points - a.points)[0]
  if (!best) return { ...state, drawIndex: state.drawIndex + 1 }
  // Bot always grabs a sanctuary when eligible; picks the first available.
  const sanct = hasSanctuaryAccess(state, 'bot') && state.sanctuaryMarket.length > 0
    ? state.sanctuaryMarket[0]!.id
    : null
  return takeDraw(state, 'bot', best, sanct)
}

/**
 * Refill both markets from their decks (up to 3 each), advance round or
 * end the match.
 */
export function endRound(state: MatchState): MatchState {
  // Refill region market to 3.
  const needRegions = Math.max(0, 3 - state.regionMarket.length)
  const drawnRegions = state.regionDeck.slice(0, needRegions)
  const newRegionMarket = [...state.regionMarket, ...drawnRegions]
  const newRegionDeck   = state.regionDeck.slice(needRegions)

  // Refill sanctuary market to 3.
  const needSancts = Math.max(0, 3 - state.sanctuaryMarket.length)
  const drawnSancts = state.sanctuaryDeck.slice(0, needSancts)
  const newSanctuaryMarket = [...state.sanctuaryMarket, ...drawnSancts]
  const newSanctuaryDeck   = state.sanctuaryDeck.slice(needSancts)

  const nextRound = state.round + 1
  const done = nextRound > TOTAL_ROUNDS

  return {
    ...state,
    round: done ? state.round : nextRound,
    phase: done ? 'end' : 'select',
    regionMarket: newRegionMarket,
    regionDeck: newRegionDeck,
    sanctuaryMarket: newSanctuaryMarket,
    sanctuaryDeck: newSanctuaryDeck,
    selections: { human: null, bot: null },
    drawOrder: [],
    drawIndex: 0,
  }
}

export function isDrawPhaseComplete(state: MatchState): boolean {
  return state.phase === 'draw' && state.drawIndex >= state.drawOrder.length
}

export function currentDrawer(state: MatchState): PlayerId | null {
  if (state.phase !== 'draw') return null
  return state.drawOrder[state.drawIndex] ?? null
}
