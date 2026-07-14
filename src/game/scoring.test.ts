import { describe, it, expect } from 'vitest'
import { scorePlayer, buildCtx, explorationDuration, resolveWinner } from './scoring.ts'
import type { RegionCard, SanctuaryCard } from './types.ts'

function card(
  id: number,
  rewards: RegionCard['rewards'],
  requirement: RegionCard['requirement'],
  points: number,
  opts: { name?: string; isNight?: boolean; clues?: number } = {},
): RegionCard {
  return {
    id,
    name: opts.name ?? `C${id}`,
    illustration: 'mountain',
    isNight: opts.isNight ?? false,
    rewards,
    clues: opts.clues ?? 0,
    requirement,
    points,
  }
}

/** Test-only sanctuary factory — supplies flat top + bottom scores. */
function fixedSanctuary(id: number, top: number, bottom: number, opts: { clues?: number; supplies?: SanctuaryCard['supplies'] } = {}): SanctuaryCard {
  return {
    id,
    name: `S${id}`,
    topLabel: '',
    bottomLabel: '',
    clues: opts.clues ?? 0,
    topScoreFn: () => top,
    bottomScoreFn: () => bottom,
    supplies: opts.supplies,
  }
}

describe('scoring · reverse scan', () => {
  it('first-placed card (leftmost) always sees empty left → conditional cards score 0', () => {
    // Note: the leftmost card sees no cards to its left, so its own
    // day/night marker doesn't apply — only left cards do.
    const tableau: RegionCard[] = [
      card(10, [], { moon: 1 }, 5),  // requires moon, but nothing to its left
    ]
    const s = scorePlayer('human', tableau, [])
    expect(s.regionScore).toBe(0)
  })

  it('leftmost card with empty requirement scores flat points', () => {
    const tableau: RegionCard[] = [
      card(10, ['moon'], {}, 3),
    ]
    const s = scorePlayer('human', tableau, [])
    expect(s.regionScore).toBe(3)
  })

  it('right card scores using left cards icons', () => {
    const tableau: RegionCard[] = [
      card(1, ['moon'], {}, 1),      // left  supplies 🌙 reward + day marker
      card(2, ['moon'], {}, 1),      // supplies another 🌙 + day marker
      card(3, [], { moon: 2 }, 10),  // requires 2× 🌙 — left has ≥2 → met
    ]
    const s = scorePlayer('human', tableau, [])
    // c1 = 1, c2 = 1, c3 = 10
    expect(s.regionScore).toBe(12)
  })

  it('condition on right card checks only cards to its left, not right', () => {
    const tableau: RegionCard[] = [
      card(1, ['forest'], {}, 1),
      card(2, [], { forest: 2 }, 10),  // needs 2 forests — only 1 to its left → 0
      card(3, ['forest'], {}, 1),
    ]
    const s = scorePlayer('human', tableau, [])
    expect(s.regionScore).toBe(1 + 0 + 1)
  })

  it('multi-icon requirement all must be met', () => {
    const tableau: RegionCard[] = [
      card(1, ['forest'], {}, 1),
      card(2, ['shell'], {}, 1),
      card(3, [], { forest: 1, shell: 1 }, 8),
    ]
    const s = scorePlayer('human', tableau, [])
    expect(s.regionScore).toBe(1 + 1 + 8)
  })

  it('partial multi-icon requirement fails', () => {
    const tableau: RegionCard[] = [
      card(1, ['forest'], {}, 1),
      card(2, [], { forest: 1, shell: 1 }, 8),
    ]
    const s = scorePlayer('human', tableau, [])
    expect(s.regionScore).toBe(1 + 0)
  })

  it('entries are ordered right-to-left', () => {
    const tableau: RegionCard[] = [
      card(1, [], {}, 1),
      card(2, [], {}, 2),
      card(3, [], {}, 3),
    ]
    const s = scorePlayer('human', tableau, [])
    expect(s.entries.map((e) => e.card.id)).toEqual([3, 2, 1])
  })
})

describe('scoring · day/night as icons', () => {
  it('night cards contribute a moon to left-side counts', () => {
    // Two night cards (no explicit moon reward) then a moon-quest card.
    const tableau: RegionCard[] = [
      card(1, [], {}, 1, { isNight: true }),
      card(2, [], {}, 1, { isNight: true }),
      card(3, [], { moon: 2 }, 8),
    ]
    const s = scorePlayer('human', tableau, [])
    // Both left cards mark night → 2 moons available → quest satisfied.
    expect(s.regionScore).toBe(10)
  })

  it('day cards contribute a day icon to left-side counts', () => {
    const tableau: RegionCard[] = [
      card(1, [], {}, 1, { isNight: false }),
      card(2, [], {}, 1, { isNight: false }),
      card(3, [], { day: 2 }, 6),
    ]
    const s = scorePlayer('human', tableau, [])
    expect(s.regionScore).toBe(8)
  })
})

describe('scoring · sanctuaries', () => {
  it('adds top + bottom halves per sanctuary', () => {
    const tableau: RegionCard[] = [card(1, [], {}, 1)]
    const s = scorePlayer('human', tableau, [fixedSanctuary(1, 5, 7)])
    expect(s.sanctuaryScore).toBe(12)
    expect(s.sanctuaryEntries).toHaveLength(1)
    expect(s.sanctuaryEntries[0]!.topEarned).toBe(5)
    expect(s.sanctuaryEntries[0]!.bottomEarned).toBe(7)
  })

  it('sanctuary supplies count toward region left-side totals', () => {
    // Region card needs feather but only the sanctuary supplies one.
    const tableau: RegionCard[] = [
      card(1, [], {}, 1),
      card(2, [], { feather: 1 }, 9),
    ]
    const withSupply = fixedSanctuary(1, 0, 0, { supplies: ['feather'] })
    const s = scorePlayer('human', tableau, [withSupply])
    expect(s.regionScore).toBe(1 + 9)
  })
})

describe('scoring · supply sanctuaries (gate-openers)', () => {
  it('a moon-supply sanctuary lets a moon-quest region satisfy when nothing else supplies moon', () => {
    // Region needs moon: 2. Tableau alone supplies 0 moon (all day cards).
    // Add a "달의 눈"-style sanctuary that supplies moon×2 → quest met.
    const tableau: RegionCard[] = [
      card(1, [], {}, 1, { isNight: false }),
      card(2, [], {}, 1, { isNight: false }),
      card(3, [], { moon: 2 }, 8),
    ]
    const moonSupplier = fixedSanctuary(1, 0, 0, { supplies: ['moon', 'moon'] })
    const noSupply = scorePlayer('human', tableau, [])
    const withSupply = scorePlayer('human', tableau, [moonSupplier])
    // Without supply: c3 fails (0 moon on left).
    expect(noSupply.regionScore).toBe(1 + 1 + 0)
    // With supply: c3 succeeds.
    expect(withSupply.regionScore).toBe(1 + 1 + 8)
  })

  it('multiple supply icons stack across sanctuaries', () => {
    const tableau: RegionCard[] = [
      card(1, [], {}, 1),
      card(2, [], { shell: 2, feather: 1 }, 10),
    ]
    const shellSup = fixedSanctuary(1, 0, 0, { supplies: ['shell', 'shell'] })
    const featherSup = fixedSanctuary(2, 0, 0, { supplies: ['feather'] })
    const s = scorePlayer('human', tableau, [shellSup, featherSup])
    expect(s.regionScore).toBe(1 + 10)
  })

  it('supply icons also count in buildCtx iconTotals (for sanctuary bottoms)', () => {
    const tableau: RegionCard[] = [card(1, [], {}, 1)]
    const shellSup = fixedSanctuary(1, 0, 0, { supplies: ['shell', 'shell'] })
    const ctx = buildCtx(tableau, [shellSup])
    expect(ctx.iconTotals.shell).toBe(2)
  })
})

describe('buildCtx · derived aggregates', () => {
  it('counts night vs day and totals icons across rewards + markers', () => {
    const tableau: RegionCard[] = [
      card(1, ['shell'], {}, 1, { isNight: true }),      // moon marker + shell reward
      card(2, ['feather', 'day'], {}, 1),                // day marker + day + feather
      card(3, ['moon'], {}, 1, { isNight: true }),       // moon marker + moon reward
    ]
    const ctx = buildCtx(tableau, [])
    expect(ctx.nightCount).toBe(2)
    expect(ctx.dayCount).toBe(1)
    // Icon totals:
    //   moon    = 2 markers + 1 reward = 3
    //   day     = 1 marker  + 1 reward = 2
    //   shell   = 1
    //   feather = 1
    //   forest  = 0
    expect(ctx.iconTotals.moon).toBe(3)
    expect(ctx.iconTotals.day).toBe(2)
    expect(ctx.iconTotals.shell).toBe(1)
    expect(ctx.iconTotals.feather).toBe(1)
    expect(ctx.iconTotals.forest).toBe(0)
  })
})

describe('tiebreaker · exploration duration', () => {
  it('explorationDuration sums the card ids', () => {
    const tab: RegionCard[] = [card(3, [], {}, 1), card(5, [], {}, 1), card(10, [], {}, 1)]
    expect(explorationDuration(tab)).toBe(18)
  })

  it('empty tableau has duration 0', () => {
    expect(explorationDuration([])).toBe(0)
  })

  it('higher-total player wins outright, no tiebreak needed', () => {
    const a = { total: 50, tableau: [card(30, [], {}, 1)] }
    const b = { total: 40, tableau: [card(1,  [], {}, 1)] }
    expect(resolveWinner(a, b)).toBe('a')
    expect(resolveWinner(b, a)).toBe('b')
  })

  it('on equal totals, LOWER duration wins ("shorter journey")', () => {
    // Both scored 40. A has tiny duration (7); B has huge duration (55).
    const a = { total: 40, tableau: [card(3, [], {}, 1), card(4, [], {}, 1)] }
    const b = { total: 40, tableau: [card(25, [], {}, 1), card(30, [], {}, 1)] }
    expect(resolveWinner(a, b)).toBe('a')
    expect(resolveWinner(b, a)).toBe('b')
  })

  it('equal totals AND equal durations → draw', () => {
    const a = { total: 20, tableau: [card(5, [], {}, 1), card(10, [], {}, 1)] }
    const b = { total: 20, tableau: [card(7, [], {}, 1), card(8, [], {}, 1)] }
    expect(resolveWinner(a, b)).toBe('draw')
  })
})
