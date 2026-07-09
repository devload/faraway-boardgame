import { describe, it, expect } from 'vitest'
import { scorePlayer } from './scoring.ts'
import type { RegionCard } from './types.ts'

function card(id: number, rewards: RegionCard['rewards'], requirement: RegionCard['requirement'], points: number, name = `C${id}`): RegionCard {
  return { id, name, illustration: 'mountain', rewards, requirement, points }
}

describe('scoring · reverse scan', () => {
  it('first-placed card (leftmost) always sees empty left → conditional cards score 0', () => {
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
      card(1, ['moon'], {}, 1),      // left  supplies 🌙
      card(2, ['moon'], {}, 1),      // supplies another 🌙
      card(3, [], { moon: 2 }, 10),  // requires 2× 🌙 — left has 2 → met
    ]
    const s = scorePlayer('human', tableau, [])
    // c1 = 1, c2 = 1, c3 = 10
    expect(s.regionScore).toBe(12)
  })

  it('condition on right card checks only cards to its left, not right', () => {
    // Structure: [moon-supplier, condition-card, moon-supplier]
    // The condition card should NOT see the moon-supplier to its right.
    const tableau: RegionCard[] = [
      card(1, ['moon'], {}, 1),
      card(2, [], { moon: 2 }, 10),  // needs 2 moons — but only 1 to its left → 0
      card(3, ['moon'], {}, 1),
    ]
    const s = scorePlayer('human', tableau, [])
    expect(s.regionScore).toBe(1 + 0 + 1)
  })

  it('multi-icon requirement all must be met', () => {
    const tableau: RegionCard[] = [
      card(1, ['moon'], {}, 1),
      card(2, ['shell'], {}, 1),
      card(3, [], { moon: 1, shell: 1 }, 8),
    ]
    const s = scorePlayer('human', tableau, [])
    expect(s.regionScore).toBe(1 + 1 + 8)
  })

  it('partial multi-icon requirement fails', () => {
    const tableau: RegionCard[] = [
      card(1, ['moon'], {}, 1),
      card(2, [], { moon: 1, shell: 1 }, 8),
    ]
    const s = scorePlayer('human', tableau, [])
    expect(s.regionScore).toBe(1 + 0)
  })

  it('sanctuary score adds on top of region score', () => {
    const tableau: RegionCard[] = [card(1, ['moon', 'moon'], {}, 1)]
    const s = scorePlayer('human', tableau, [{
      id: 99,
      name: 't',
      description: 't',
      scoreFn: () => 20,
    }])
    expect(s.regionScore).toBe(1)
    expect(s.sanctuaryScore).toBe(20)
    expect(s.total).toBe(21)
  })

  it('entries are ordered right-to-left', () => {
    const tableau: RegionCard[] = [
      card(1, [], {}, 1),
      card(2, [], {}, 2),
      card(3, [], {}, 3),
    ]
    const s = scorePlayer('human', tableau, [])
    // Right-to-left iteration
    expect(s.entries.map((e) => e.card.id)).toEqual([3, 2, 1])
  })
})
