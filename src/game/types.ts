/**
 * Faraway — domain types.
 *
 * The vocabulary maps to the original board game where possible:
 *   - Region card  = 지역 카드 (numbered 1..N, played into the 8-slot lineup)
 *   - Sanctuary    = 성소 카드 (bonus scoring cards, gained via ascending sequence)
 *   - Icon         = the visual language used for scoring conditions
 *   - Requirement  = what a card needs on its LEFT to score
 *   - Reward       = what a card contributes to its RIGHT when placed
 */

export type Icon = 'moon' | 'day' | 'shell' | 'feather' | 'forest'

export const ICONS: readonly Icon[] = ['moon', 'day', 'shell', 'feather', 'forest'] as const

export const ICON_EMOJI: Record<Icon, string> = {
  moon:    '🌙',
  day:     '☀️',
  shell:   '🐚',
  feather: '🪶',
  forest:  '🌲',
}

export const ICON_LABEL: Record<Icon, string> = {
  moon:    '밤',
  day:     '낮',
  shell:   '조개',
  feather: '깃털',
  forest:  '숲',
}

export type Illustration = 'mountain' | 'water' | 'forest' | 'flower' | 'ruin'

export const ILLUSTRATION_EMOJI: Record<Illustration, string> = {
  mountain: '🏔',
  water:    '🌊',
  forest:   '🌲',
  flower:   '🌸',
  ruin:     '🏛',
}

/** A requirement is a bag of icons the LEFT-side cards must supply. */
export type IconRequirement = Partial<Record<Icon, number>>

export type RegionCard = {
  id: number
  /** Fantasy region name in Korean. */
  name: string
  /** Short evocative subtitle rendered under the name in italic serif. */
  subtitle?: string
  illustration: Illustration
  /** Icons this card adds to the tableau when placed (activated immediately). */
  rewards: Icon[]
  /**
   * Icons that must appear (summed) among cards to the LEFT of this one.
   * Empty = no requirement (always scores base points).
   */
  requirement: IconRequirement
  /**
   * Points if requirement met (or flat points if requirement is empty).
   * Cards with a big requirement have big points; safe cards have low flat points.
   */
  points: number
}

export type SanctuaryCard = {
  id: number
  name: string
  description: string
  /** Runs against final tableau + other sanctuaries. */
  scoreFn: (tableau: readonly RegionCard[], sanctuaries: readonly SanctuaryCard[]) => number
}

/** For MVP we run 1 human + 1 bot; type stays open for future expansion. */
export type PlayerId = 'human' | 'bot'

export type PlayerState = {
  id: PlayerId
  name: string
  icon: string
  hand: RegionCard[]
  tableau: RegionCard[]          // grows left → right, max 8
  sanctuaries: SanctuaryCard[]
}

export type MatchPhase =
  | 'select'         // players pick from hand (simultaneous, bot auto-picks)
  | 'reveal'         // brief pause to show what was played
  | 'draw'           // draw order in progress
  | 'end'            // game complete → scoring

export type MatchState = {
  round: number           // 1..8
  players: Record<PlayerId, PlayerState>
  regionMarket: RegionCard[]
  regionDeck: RegionCard[]
  sanctuaryMarket: SanctuaryCard[]
  sanctuaryDeck: SanctuaryCard[]
  phase: MatchPhase
  /** This round's plays (null until each player selects). */
  selections: Record<PlayerId, RegionCard | null>
  /** Draw order this round, computed after both players select. */
  drawOrder: PlayerId[]
  /** Index into drawOrder — which player is currently taking their draw action. */
  drawIndex: number
  seed: number
}

export type ScoreEntry = {
  card: RegionCard
  /** null if requirement was empty (flat score) or requirement met. */
  metRequirement: boolean
  earned: number
  /** Icons that were on the LEFT at scoring time — for UI display. */
  leftIcons: Record<Icon, number>
}

export type ScoreBreakdown = {
  playerId: PlayerId
  entries: ScoreEntry[]        // one per tableau slot, right-to-left order
  sanctuaryScore: number
  regionScore: number
  total: number
}
