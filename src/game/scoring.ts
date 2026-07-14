import type {
  Icon,
  RegionCard,
  SanctuaryCard,
  SanctuaryScoreCtx,
  ScoreBreakdown,
  ScoreEntry,
  SanctuaryScoreEntry,
} from './types.ts'
import { ICONS } from './types.ts'

/**
 * Reverse scoring — Faraway's signature mechanic.
 *
 * Walk the tableau from RIGHT to LEFT. For each card, check its
 * requirement against the cumulative icons of cards **to its left**
 * (i.e. cards placed BEFORE it). If met, add points; otherwise 0.
 *
 * Each region also contributes its `isNight` marker as a `moon` icon
 * and `!isNight` as a `day` icon to left-side totals — that's how the
 * original folds the day/night pictograms into the same icon vocabulary
 * regions actually query.
 *
 * Sanctuaries score independently at the end via top+bottom halves.
 */
export function scorePlayer(
  playerId: string,
  tableau: readonly RegionCard[],
  sanctuaries: readonly SanctuaryCard[],
): ScoreBreakdown {
  const entries: ScoreEntry[] = []
  let regionScore = 0

  // Scan right → left. `i` is the slot being scored.
  for (let i = tableau.length - 1; i >= 0; i--) {
    const card = tableau[i]!

    // Sum icons from cards to the LEFT (indices 0..i-1) + their day/night marker.
    const leftIcons = emptyIconMap()
    for (let j = 0; j < i; j++) {
      const left = tableau[j]!
      for (const icon of left.rewards) leftIcons[icon]++
      leftIcons[left.isNight ? 'moon' : 'day']++
    }
    // Sanctuaries that supply icons also count toward left-side totals.
    for (const s of sanctuaries) {
      if (s.supplies) for (const icon of s.supplies) leftIcons[icon]++
    }

    const req = card.requirement
    const met = Object.entries(req).every(([icon, needed]) => leftIcons[icon as Icon] >= (needed ?? 0))
    const earned = met ? card.points : 0
    regionScore += earned

    entries.push({ card, metRequirement: met, earned, leftIcons })
  }

  // Sanctuary scoring: build ctx once, run each half.
  const ctx = buildCtx(tableau, sanctuaries)
  const sanctuaryEntries: SanctuaryScoreEntry[] = sanctuaries.map((s) => ({
    sanctuary: s,
    topEarned: s.topScoreFn(ctx),
    bottomEarned: s.bottomScoreFn(ctx),
  }))
  const sanctuaryScore = sanctuaryEntries.reduce((sum, e) => sum + e.topEarned + e.bottomEarned, 0)

  return {
    playerId: playerId as ScoreBreakdown['playerId'],
    entries,
    sanctuaryEntries,
    regionScore,
    sanctuaryScore,
    total: regionScore + sanctuaryScore,
  }
}

/** Public helper — used by UI + bot to peek per-sanctuary totals. */
export function buildCtx(
  tableau: readonly RegionCard[],
  sanctuaries: readonly SanctuaryCard[],
): SanctuaryScoreCtx {
  const iconTotals = emptyIconMap()
  let nightCount = 0
  let dayCount = 0
  for (const c of tableau) {
    for (const icon of c.rewards) iconTotals[icon]++
    if (c.isNight) { iconTotals.moon++; nightCount++ }
    else            { iconTotals.day++;  dayCount++  }
  }
  for (const s of sanctuaries) {
    if (s.supplies) for (const icon of s.supplies) iconTotals[icon]++
  }
  return { tableau, sanctuaries, iconTotals, nightCount, dayCount }
}

function emptyIconMap(): Record<Icon, number> {
  const m = {} as Record<Icon, number>
  for (const i of ICONS) m[i] = 0
  return m
}

/**
 * Exploration duration = sum of numbers on the played region cards.
 * Used as the official rulebook tiebreaker: on equal totals, the player
 * with the LOWER duration wins (they took the shorter journey).
 */
export function explorationDuration(tableau: readonly RegionCard[]): number {
  return tableau.reduce((s, c) => s + c.id, 0)
}

/**
 * Given two scored players, decide the winner per the rulebook:
 *   1. Higher total wins.
 *   2. On tie, the lower exploration duration wins.
 *   3. On a full tie of both, it's a draw.
 * Returns 'a' | 'b' | 'draw'.
 */
export function resolveWinner(
  a: { total: number; tableau: readonly RegionCard[] },
  b: { total: number; tableau: readonly RegionCard[] },
): 'a' | 'b' | 'draw' {
  if (a.total !== b.total) return a.total > b.total ? 'a' : 'b'
  const da = explorationDuration(a.tableau)
  const db = explorationDuration(b.tableau)
  if (da === db) return 'draw'
  return da < db ? 'a' : 'b'
}
