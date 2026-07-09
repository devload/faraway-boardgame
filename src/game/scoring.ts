import type { Icon, RegionCard, SanctuaryCard, ScoreBreakdown, ScoreEntry } from './types.ts'
import { ICONS } from './types.ts'

/**
 * Reverse scoring — Faraway's signature mechanic.
 *
 * Walk the tableau from RIGHT to LEFT. For each card, check its
 * requirement against the cumulative icons of cards **to its left**
 * (i.e. cards placed BEFORE it). If met, add points; otherwise 0.
 *
 * Then add sanctuary scores.
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

    // Sum icons from cards to the LEFT (indices 0..i-1).
    const leftIcons = emptyIconMap()
    for (let j = 0; j < i; j++) {
      for (const icon of tableau[j]!.rewards) {
        leftIcons[icon]++
      }
    }

    // Check requirement.
    const req = card.requirement
    const met = Object.entries(req).every(([icon, needed]) => leftIcons[icon as Icon] >= (needed ?? 0))

    const earned = met ? card.points : 0
    regionScore += earned

    entries.push({
      card,
      metRequirement: met,
      earned,
      leftIcons,
    })
  }

  const sanctuaryScore = sanctuaries.reduce((sum, s) => sum + s.scoreFn(tableau, sanctuaries), 0)

  return {
    playerId: playerId as ScoreBreakdown['playerId'],
    entries,
    regionScore,
    sanctuaryScore,
    total: regionScore + sanctuaryScore,
  }
}

function emptyIconMap(): Record<Icon, number> {
  const m = {} as Record<Icon, number>
  for (const i of ICONS) m[i] = 0
  return m
}
