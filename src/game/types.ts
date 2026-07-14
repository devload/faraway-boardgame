/**
 * Faraway — domain types.
 *
 * Vocabulary bridge to the original board game (Catch Up Games, 2023):
 *
 *   • Region card    = the numbered exploration cards (1..N) played into
 *                      the 8-slot lineup. Each card has a day OR night
 *                      timing, some reward icons, an optional clue, and
 *                      often a "quest" (icon requirement) worth points at
 *                      end of game.
 *   • Sanctuary card = smaller bonus cards. Each has TWO scoring halves:
 *                        - top:    "immediate" bonus at end of game
 *                                  (resource multipliers, night counters,
 *                                  or an instant Clue that raises the
 *                                  Sanctuary draw size).
 *                        - bottom: "side-quest" scoring against tableau
 *                                  patterns.
 *                      Some sanctuaries can supply extra clues (immediate).
 *   • Icon           = shared visual language for scoring conditions.
 *                      We keep the 5-icon vocabulary from our earlier
 *                      pass but map cleanly onto the original:
 *                        - moon  = 🌙  night marker (also usable as a
 *                                  quest resource)
 *                        - day   = ☀️  day marker
 *                        - shell = 🐚  resource "stone"    (uddu)
 *                        - feather=🪶  resource "thistle"  (goldlog)
 *                        - forest= 🌲  resource "deer"     (okiko)
 *                      Distribution keeps shell most common → feather
 *                      rarest, matching the original scarcity curve.
 *   • Clue           = 📜 pictured on some cards. In End of Exploration
 *                      you draw (1 + clueCount) sanctuaries and keep one.
 *
 * Scoring intent (reverse scan): each card is turned over right→left.
 * A card's requirement is checked against the icons summed from cards
 * to its LEFT (including sanctuaries — sanctuaries contribute icons
 * once they've been chosen). Then sanctuaries score their own halves.
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
  /**
   * Whether the card carries the night (🌙) or day (☀️) marker.
   * In the original this affects which sanctuary bonuses count.
   * Independent of `rewards` — a card can be a Night card and still
   * offer, say, a shell reward.
   */
  isNight: boolean
  /**
   * Icons this card adds to the tableau when placed (activated
   * immediately for future-quest satisfaction). Excludes the day/night
   * marker, which is tracked separately via `isNight`.
   */
  rewards: Icon[]
  /**
   * How many clue pictograms are printed on this card. Each clue raises
   * the number of Sanctuary cards you draw during "Find Sanctuaries" by
   * one. Most cards have 0; a handful have 1.
   */
  clues: number
  /**
   * Icons that must appear (summed) among cards to the LEFT of this one.
   * Empty = no quest (safe flat points).
   */
  requirement: IconRequirement
  /**
   * Points if requirement met (or flat points if requirement is empty).
   * Cards with a big requirement have big points; safe cards have low
   * flat points.
   */
  points: number
}

/** Full scoring context available to any sanctuary scoring function. */
export type SanctuaryScoreCtx = {
  readonly tableau: readonly RegionCard[]
  readonly sanctuaries: readonly SanctuaryCard[]
  /** Total moon (night) cards in the tableau. Precomputed for convenience. */
  readonly nightCount: number
  /** Total day cards in the tableau. */
  readonly dayCount: number
  /** Icon totals across tableau rewards + isNight marker as moon. */
  readonly iconTotals: Record<Icon, number>
}

export type SanctuaryCard = {
  id: number
  name: string
  /** Human-readable TOP-half rule (bonus). */
  topLabel: string
  /** Human-readable BOTTOM-half rule (side-quest). */
  bottomLabel: string
  /**
   * Extra clues this sanctuary supplies while it is in your hand-or-tableau.
   * Applied at the "Find Sanctuaries" step of the FOLLOWING round.
   * 0 for most, 1 for a handful.
   */
  clues: number
  /** Top-half scoring at end of game. */
  topScoreFn: (ctx: SanctuaryScoreCtx) => number
  /** Bottom-half scoring at end of game. */
  bottomScoreFn: (ctx: SanctuaryScoreCtx) => number
  /**
   * Optional: icons this sanctuary contributes to left-side counts for
   * region quests. Original rulebook: sanctuaries with an icon in the
   * corner count toward those totals. Empty for the reworked pool since
   * we keep icon-supply mainly on regions.
   */
  supplies?: Icon[]
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
  /**
   * Sanctuary cards drawn THIS round (during "Find Sanctuaries") that
   * are pending a keep-one-return-rest decision in the Draft phase.
   * Cleared after the draft resolves.
   */
  sanctuaryChoices: SanctuaryCard[]
}

export type MatchPhase =
  /** Phase 1: players simultaneously pick one region from hand (face-down). */
  | 'explore'
  /** Phase 2: reveal + auto-resolve Find-Sanctuaries (deal choices per player). */
  | 'reveal'
  /**
   * Phase 3: End of Exploration — resolved in draw order (lowest # first).
   * Each turn a player takes a Region from the market AND locks in one
   * of their sanctuary choices (or none if they weren't eligible).
   */
  | 'draft'
  /** Match complete → scoring. */
  | 'end'

export type MatchState = {
  round: number           // 1..8
  players: Record<PlayerId, PlayerState>
  regionMarket: RegionCard[]
  regionDeck: RegionCard[]
  /**
   * Sanctuary deck (face-down). Cards are drawn from top and returned
   * to the BOTTOM when a player discards choices they didn't keep.
   */
  sanctuaryDeck: SanctuaryCard[]
  phase: MatchPhase
  /** This round's plays (null until each player selects). */
  selections: Record<PlayerId, RegionCard | null>
  /** Draw order this round, computed after reveal (lowest # goes first). */
  drawOrder: PlayerId[]
  /** Index into drawOrder — which player is currently doing their draft. */
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

export type SanctuaryScoreEntry = {
  sanctuary: SanctuaryCard
  topEarned: number
  bottomEarned: number
}

export type ScoreBreakdown = {
  playerId: PlayerId
  entries: ScoreEntry[]              // one per tableau slot, right-to-left order
  sanctuaryEntries: SanctuaryScoreEntry[]
  sanctuaryScore: number
  regionScore: number
  total: number
}
