import { describe, it, expect } from 'vitest'
import { REGION_CARDS, cardById } from './cards.ts'
import { SANCTUARY_CARDS, sanctuaryById } from './sanctuaries.ts'
import type { Icon } from './types.ts'

/**
 * Static pool assertions — guards the tuning parameters so a careless
 * edit to cards.ts / sanctuaries.ts can't silently drop the game back
 * into the pre-expansion MVP shape.
 */

describe('region pool composition', () => {
  it('has 48 cards, ids 1..48 contiguous and unique', () => {
    expect(REGION_CARDS).toHaveLength(48)
    const ids = REGION_CARDS.map((c) => c.id).sort((a, b) => a - b)
    expect(ids).toEqual(Array.from({ length: 48 }, (_, i) => i + 1))
  })

  it('cardById works for every id in the pool', () => {
    for (let i = 1; i <= 48; i++) expect(cardById(i).id).toBe(i)
  })

  it('night ratio stays roughly ~40-50% (matches original scarcity curve)', () => {
    const night = REGION_CARDS.filter((c) => c.isNight).length
    // 22/48 exactly — assert a band so future retunes have wiggle room.
    expect(night).toBeGreaterThanOrEqual(18)
    expect(night).toBeLessThanOrEqual(26)
  })

  it('at least 8 clue-bearing cards for sanctuary draw variety', () => {
    const totalClues = REGION_CARDS.reduce((s, c) => s + c.clues, 0)
    expect(totalClues).toBeGreaterThanOrEqual(8)
  })

  it('every illustration type appears at least 6 times (variety guarantee)', () => {
    const kinds = ['mountain', 'water', 'forest', 'flower', 'ruin'] as const
    for (const k of kinds) {
      const n = REGION_CARDS.filter((c) => c.illustration === k).length
      expect(n, `illustration ${k}`).toBeGreaterThanOrEqual(6)
    }
  })

  it('every icon reward appears at least once in the pool', () => {
    const rewardIcons = new Set<Icon>()
    for (const c of REGION_CARDS) for (const r of c.rewards) rewardIcons.add(r)
    for (const i of ['moon', 'day', 'shell', 'feather', 'forest'] as Icon[]) {
      expect(rewardIcons.has(i), `icon ${i}`).toBe(true)
    }
  })

  it('point curve escalates from low ids to high ids (rewards ambition)', () => {
    // Compare a "safe low" band vs a "high-quest" band. The mid tier
    // is broad by design (mixed low/high scorers), so we assert only
    // low < high which is the real balance guarantee.
    const avg = (start: number, end: number) => {
      const slice = REGION_CARDS.filter((c) => c.id >= start && c.id <= end)
      return slice.reduce((s, c) => s + c.points, 0) / slice.length
    }
    const low = avg(1, 10)
    const high = avg(41, 48)
    expect(low).toBeLessThan(high)
  })
})

describe('sanctuary pool composition', () => {
  it('has 24 cards, ids 1..24 contiguous and unique', () => {
    expect(SANCTUARY_CARDS).toHaveLength(24)
    const ids = SANCTUARY_CARDS.map((s) => s.id).sort((a, b) => a - b)
    expect(ids).toEqual(Array.from({ length: 24 }, (_, i) => i + 1))
  })

  it('sanctuaryById works for every id', () => {
    for (let i = 1; i <= 24; i++) expect(sanctuaryById(i).id).toBe(i)
  })

  it('has at least 3 gate-opener sanctuaries with `supplies` filled', () => {
    const suppliers = SANCTUARY_CARDS.filter((s) => s.supplies && s.supplies.length > 0)
    expect(suppliers.length).toBeGreaterThanOrEqual(3)
  })

  it('gate-opener supplies span multiple icons (no single-icon monopoly)', () => {
    const iconsSupplied = new Set<Icon>()
    for (const s of SANCTUARY_CARDS) {
      if (s.supplies) for (const i of s.supplies) iconsSupplied.add(i)
    }
    expect(iconsSupplied.size).toBeGreaterThanOrEqual(3)
  })

  it('every sanctuary has non-empty labels (UI would break otherwise)', () => {
    for (const s of SANCTUARY_CARDS) {
      expect(s.topLabel.length).toBeGreaterThan(0)
      expect(s.bottomLabel.length).toBeGreaterThan(0)
    }
  })
})
