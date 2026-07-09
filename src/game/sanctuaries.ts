import type { Icon, SanctuaryCard } from './types.ts'

/**
 * Sanctuary cards — the "bonus" deck. Every one is a scoring card
 * evaluated at end of game. In the original there are also immediate-
 * effect sanctuaries; those are deferred to a later pass.
 */

function countIcon(tableau: readonly { rewards: readonly Icon[] }[], icon: Icon): number {
  return tableau.reduce((sum, card) => sum + card.rewards.filter((i) => i === icon).length, 0)
}

function countDistinctIcons(tableau: readonly { rewards: readonly Icon[] }[]): number {
  const set = new Set<Icon>()
  tableau.forEach((c) => c.rewards.forEach((i) => set.add(i)))
  return set.size
}

export const SANCTUARY_CARDS: readonly SanctuaryCard[] = [
  {
    id: 1,
    name: '달빛 성소',
    description: '🌙 아이콘 1개당 +2점',
    scoreFn: (t) => countIcon(t, 'moon') * 2,
  },
  {
    id: 2,
    name: '태양의 신전',
    description: '☀️ 아이콘 1개당 +3점',
    scoreFn: (t) => countIcon(t, 'day') * 3,
  },
  {
    id: 3,
    name: '조개의 사당',
    description: '🐚 아이콘 1개당 +2점',
    scoreFn: (t) => countIcon(t, 'shell') * 2,
  },
  {
    id: 4,
    name: '깃털 문루',
    description: '🪶 아이콘 1개당 +4점',
    scoreFn: (t) => countIcon(t, 'feather') * 4,
  },
  {
    id: 5,
    name: '숲의 은신처',
    description: '🌲 아이콘 1개당 +3점',
    scoreFn: (t) => countIcon(t, 'forest') * 3,
  },
  {
    id: 6,
    name: '무지개 봉우리',
    description: '아이콘 종류 1개당 +4점',
    scoreFn: (t) => countDistinctIcons(t) * 4,
  },
  {
    id: 7,
    name: '고요의 회당',
    description: '홀수 번호 카드 1장당 +2점',
    scoreFn: (t) => t.filter((c) => c.id % 2 === 1).length * 2,
  },
  {
    id: 8,
    name: '거울의 방',
    description: '짝수 번호 카드 1장당 +2점',
    scoreFn: (t) => t.filter((c) => c.id % 2 === 0).length * 2,
  },
  {
    id: 9,
    name: '망각의 문',
    description: '가장 큰 번호 카드의 번호만큼 점수 (0.3배)',
    scoreFn: (t) => Math.floor(Math.max(0, ...t.map((c) => c.id)) * 0.3),
  },
  {
    id: 10,
    name: '조우의 광장',
    description: '조건이 있는 카드 1장당 +3점',
    scoreFn: (t) => t.filter((c) => Object.keys(c.requirement).length > 0).length * 3,
  },
]

export function sanctuaryById(id: number): SanctuaryCard {
  const s = SANCTUARY_CARDS.find((s) => s.id === id)
  if (!s) throw new Error(`Unknown sanctuary #${id}`)
  return s
}
