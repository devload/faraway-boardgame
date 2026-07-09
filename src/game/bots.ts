import type { Icon, MatchState, PlayerState, RegionCard } from './types.ts'
import { ICONS } from './types.ts'

/**
 * Simple heuristic AI. Scores each hand card by:
 *
 *   1. Immediate satisfaction — if this card would score right now given
 *      the current tableau, add its point value.
 *   2. Sanctuary access — favor cards that keep the ascending streak.
 *   3. Future value — light bonus for reward icons that unlock future
 *      conditions (rough heuristic — count unique icons added).
 *
 * Not competitive with a strong human but plays the shape of the game.
 */
export function pickBotCard(bot: PlayerState, _state: MatchState): RegionCard {
  const tableauIcons = countIcons(bot.tableau.flatMap((c) => c.rewards))
  const lastPlayed = bot.tableau[bot.tableau.length - 1]?.id ?? -1

  let bestCard: RegionCard = bot.hand[0]!
  let bestScore = -Infinity

  for (const candidate of bot.hand) {
    let score = 0

    // (1) Immediate scoring potential.
    const req = candidate.requirement
    const met = Object.entries(req).every(([icon, needed]) => tableauIcons[icon as Icon] >= (needed ?? 0))
    if (met && Object.keys(req).length > 0) {
      score += candidate.points * 1.5
    } else if (Object.keys(req).length === 0) {
      // Flat cards always score their base — just count directly.
      score += candidate.points
    } else {
      // Would fail — small penalty for wasting the slot.
      score -= 2
    }

    // (2) Ascending sanctuary access.
    if (candidate.id > lastPlayed) score += 4

    // (3) Reward diversity nudge.
    const uniqueNewIcons = new Set(candidate.rewards).size
    score += uniqueNewIcons * 0.5

    if (score > bestScore) {
      bestScore = score
      bestCard = candidate
    }
  }

  return bestCard
}

function countIcons(icons: readonly Icon[]): Record<Icon, number> {
  const m = {} as Record<Icon, number>
  for (const i of ICONS) m[i] = 0
  for (const i of icons) m[i]++
  return m
}
