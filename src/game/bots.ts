import type { Icon, MatchState, PlayerState, RegionCard } from './types.ts'
import { ICONS } from './types.ts'

/**
 * Simple heuristic AI for the "Explore" pick.
 *
 * Scores each hand card by:
 *   1. Immediate satisfaction — if this card would score right now given
 *      the current tableau, weight it.
 *   2. Sanctuary access — favor cards that keep the ascending streak
 *      (higher weight when the bot has clues on the table already, since
 *      each clue multiplies the sanctuary payoff).
 *   3. Reward diversity — light bonus for reward icons that could unlock
 *      future quests.
 *   4. Late-game bias — save night/high-quest cards for the right side of
 *      the tableau.
 *
 * Not competitive with a strong human but plays the shape of the game.
 */
export function pickBotCard(bot: PlayerState, state: MatchState): RegionCard {
  const tableauIcons = countIcons(bot)
  const lastPlayed = bot.tableau[bot.tableau.length - 1]?.id ?? -1
  const roundsLeft = 8 - state.round      // includes this round

  let bestCard: RegionCard = bot.hand[0]!
  let bestScore = -Infinity

  const currentClues =
    bot.tableau.reduce((s, c) => s + c.clues, 0)
    + bot.sanctuaries.reduce((s, c) => s + c.clues, 0)

  for (const candidate of bot.hand) {
    let score = 0

    // (1) Immediate scoring potential.
    const req = candidate.requirement
    const met = Object.entries(req).every(
      ([icon, needed]) => tableauIcons[icon as Icon] >= (needed ?? 0),
    )
    if (met && Object.keys(req).length > 0) {
      score += candidate.points * 1.5
    } else if (Object.keys(req).length === 0) {
      score += candidate.points
    } else {
      // Would fail — small penalty for wasting the slot, but not fatal
      // since scoring is right→left and cards to the right may help.
      score -= 1.5
    }

    // (2) Ascending sanctuary access.
    if (candidate.id > lastPlayed) {
      // A clue-loaded bot gets much more per sanctuary draw.
      score += 4 + currentClues * 2.5
      // Extra reward if this card ALSO carries a clue (compounding).
      if (candidate.clues > 0) score += 3
    }

    // (3) Reward diversity nudge — new unique icons unlock future quests.
    const newIcons = candidate.rewards.filter((i) => tableauIcons[i] === 0)
    score += newIcons.length * 0.6

    // (4) Late-game bias: prefer high numbers when we're near the end.
    if (roundsLeft <= 3) {
      score += candidate.id * 0.1
    } else {
      // Early game: mild preference for LOW cards so we save the highs
      // for the right-side scoring slots.
      score -= candidate.id * 0.05
    }

    if (score > bestScore) {
      bestScore = score
      bestCard = candidate
    }
  }

  return bestCard
}

function countIcons(bot: PlayerState): Record<Icon, number> {
  const m = {} as Record<Icon, number>
  for (const i of ICONS) m[i] = 0
  for (const c of bot.tableau) {
    for (const icon of c.rewards) m[icon]++
    m[c.isNight ? 'moon' : 'day']++
  }
  return m
}
