import { describe, it, expect } from 'vitest'
import {
  initMatch,
  selectCard,
  fillBotSelection,
  revealAndFindSanctuaries,
  takeDraft,
  botDraft,
  endRound,
  isAscending,
  currentDrafter,
  isDraftPhaseComplete,
  sanctuaryDrawSize,
  TOTAL_ROUNDS,
} from './match.ts'

describe('match · setup', () => {
  it('initMatch produces 3-card hands, market of 3, both players at 0 tableau', () => {
    const s = initMatch(42)
    expect(s.round).toBe(1)
    expect(s.phase).toBe('explore')
    expect(s.players.human.hand).toHaveLength(3)
    expect(s.players.bot.hand).toHaveLength(3)
    expect(s.regionMarket).toHaveLength(3)
    expect(s.players.human.tableau).toHaveLength(0)
    expect(s.players.human.sanctuaryChoices).toHaveLength(0)
  })

  it('all initial region cards are unique across hands + market + deck', () => {
    const s = initMatch(42)
    const ids = [
      ...s.players.human.hand.map((c) => c.id),
      ...s.players.bot.hand.map((c) => c.id),
      ...s.regionMarket.map((c) => c.id),
      ...s.regionDeck.map((c) => c.id),
    ]
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('match · round 1 rule', () => {
  it('round 1: nobody draws sanctuaries (no previous card to compare)', () => {
    const s0 = initMatch(1)
    const humanCard = s0.players.human.hand[0]!
    let s = selectCard(s0, 'human', humanCard)
    s = fillBotSelection(s)
    s = revealAndFindSanctuaries(s)
    expect(s.phase).toBe('draft')
    expect(s.players.human.sanctuaryChoices).toHaveLength(0)
    expect(s.players.bot.sanctuaryChoices).toHaveLength(0)
    // No player is "ascending" on round 1.
    expect(isAscending(s.players.human)).toBe(false)
    expect(isAscending(s.players.bot)).toBe(false)
  })
})

describe('match · sanctuary access on ascending', () => {
  it('a player whose new card > previous draws (1 + clues) sanctuaries', () => {
    const s0 = initMatch(7)
    // Play round 1 first with the LOWEST card in hand for both.
    let s = s0
    s = selectCard(s, 'human', lowestId(s.players.human.hand))
    s = fillBotSelection(s)
    s = revealAndFindSanctuaries(s)
    // Complete round 1 draft.
    while (currentDrafter(s) === 'bot') s = botDraft(s)
    if (currentDrafter(s) === 'human') {
      s = takeDraft(s, 'human', s.regionMarket[0]!, null)
      while (currentDrafter(s) === 'bot') s = botDraft(s)
    }
    expect(isDraftPhaseComplete(s)).toBe(true)
    s = endRound(s)
    expect(s.round).toBe(2)

    // Round 2: play the HIGHEST card so we're guaranteed ascending.
    const highest = highestId(s.players.human.hand)
    s = selectCard(s, 'human', highest)
    s = fillBotSelection(s)
    s = revealAndFindSanctuaries(s)
    expect(isAscending(s.players.human)).toBe(true)
    // Base draw = 1 + clues on tableau/sanctuaries so far. Round-1 card
    // may or may not have a clue → assert lower bound.
    expect(s.players.human.sanctuaryChoices.length).toBeGreaterThanOrEqual(1)
    expect(s.players.human.sanctuaryChoices.length).toBe(sanctuaryDrawSize(s, 'human'))
  })
})

describe('match · draft keeps one, returns rest', () => {
  it('keeping one sanctuary from multiple choices returns others to deck bottom', () => {
    const s0 = initMatch(123)
    let s = s0
    // Round 1
    s = selectCard(s, 'human', lowestId(s.players.human.hand))
    s = fillBotSelection(s)
    s = revealAndFindSanctuaries(s)
    while (currentDrafter(s) === 'bot') s = botDraft(s)
    if (currentDrafter(s) === 'human') {
      s = takeDraft(s, 'human', s.regionMarket[0]!, null)
      while (currentDrafter(s) === 'bot') s = botDraft(s)
    }
    s = endRound(s)

    // Round 2 — ascending
    s = selectCard(s, 'human', highestId(s.players.human.hand))
    s = fillBotSelection(s)
    s = revealAndFindSanctuaries(s)

    const deckBefore = s.sanctuaryDeck.length
    const choicesBefore = s.players.human.sanctuaryChoices.length
    if (choicesBefore > 0 && currentDrafter(s) === 'human') {
      const kept = s.players.human.sanctuaryChoices[0]!
      s = takeDraft(s, 'human', s.regionMarket[0]!, kept.id)
      expect(s.players.human.sanctuaries).toContain(kept)
      expect(s.players.human.sanctuaryChoices).toHaveLength(0)
      // Returned = choicesBefore - 1.
      expect(s.sanctuaryDeck.length).toBe(deckBefore + choicesBefore - 1)
    }
  })
})

describe('match · round 8 special rule', () => {
  it('round 8: no region draft, but sanctuary flow still resolves; ends match', () => {
    // Fast-forward through 7 rounds by always playing the lowest card
    // (predictable + never crashes even if a hand runs low).
    let s = initMatch(999)
    for (let r = 1; r <= 7; r++) {
      s = selectCard(s, 'human', lowestId(s.players.human.hand))
      s = fillBotSelection(s)
      s = revealAndFindSanctuaries(s)
      while (currentDrafter(s) === 'bot') s = botDraft(s)
      if (currentDrafter(s) === 'human') {
        const sanct = s.players.human.sanctuaryChoices[0]?.id ?? null
        const region = s.regionMarket[0] ?? null
        s = takeDraft(s, 'human', region, sanct)
        while (currentDrafter(s) === 'bot') s = botDraft(s)
      }
      s = endRound(s)
    }
    expect(s.round).toBe(TOTAL_ROUNDS)

    // Round 8: play, then draft with regionPick=null.
    const marketSizeBefore = s.regionMarket.length
    s = selectCard(s, 'human', lowestId(s.players.human.hand))
    s = fillBotSelection(s)
    s = revealAndFindSanctuaries(s)
    // Bot may or may not go first — resolve both.
    while (currentDrafter(s) === 'bot') s = botDraft(s)
    if (currentDrafter(s) === 'human') {
      const sanct = s.players.human.sanctuaryChoices[0]?.id ?? null
      s = takeDraft(s, 'human', /* region */ null, sanct)
      while (currentDrafter(s) === 'bot') s = botDraft(s)
    }
    // Market untouched.
    expect(s.regionMarket.length).toBe(marketSizeBefore)
    // endRound on last round → phase 'end'.
    s = endRound(s)
    expect(s.phase).toBe('end')
    // Both tableaux exactly 8 cards long.
    expect(s.players.human.tableau).toHaveLength(TOTAL_ROUNDS)
    expect(s.players.bot.tableau).toHaveLength(TOTAL_ROUNDS)
  })
})

/* helpers */
function lowestId<T extends { id: number }>(cards: readonly T[]): T {
  return [...cards].sort((a, b) => a.id - b.id)[0]!
}
function highestId<T extends { id: number }>(cards: readonly T[]): T {
  return [...cards].sort((a, b) => b.id - a.id)[0]!
}
