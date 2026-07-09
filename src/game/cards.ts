import type { RegionCard } from './types.ts'

/**
 * MVP region card pool (30 cards, numbers 1..30 for now).
 *
 * Design intent:
 *   - Low numbers (1-10):  cheap flat-score cards, generous reward icons.
 *                          Safe to place ANYWHERE but small ceiling.
 *   - Mid numbers (11-20): mix — some have small conditions, some flat.
 *                          Sanctuary-ascension anchor point.
 *   - High numbers (21-30): fewer rewards, bigger conditional points.
 *                          Best reserved for the RIGHT side of the tableau
 *                          where left-side icons can satisfy them.
 *
 * Icon distribution keeps rewards biased toward moon/shell (common) so
 * conditions using those are usually achievable, while forest/feather are
 * scarcer to create tension around big scoring cards.
 */
export const REGION_CARDS: readonly RegionCard[] = [
  // ── Low tier (1–10) — flat scorers, icon suppliers ───────────────────
  { id: 1,  name: '아침 언덕',   illustration: 'mountain', rewards: ['moon'],                    requirement: {},              points: 1 },
  { id: 2,  name: '고요한 만',   illustration: 'water',    rewards: ['shell'],                   requirement: {},              points: 1 },
  { id: 3,  name: '이슬 정원',   illustration: 'flower',   rewards: ['moon', 'shell'],           requirement: {},              points: 2 },
  { id: 4,  name: '푸른 소로',   illustration: 'forest',   rewards: ['forest'],                  requirement: {},              points: 2 },
  { id: 5,  name: '새벽 만',     illustration: 'water',    rewards: ['shell', 'moon'],           requirement: {},              points: 2 },
  { id: 6,  name: '옛 문루',     illustration: 'ruin',     rewards: ['feather'],                 requirement: {},              points: 3 },
  { id: 7,  name: '별의 못',     illustration: 'water',    rewards: ['moon', 'moon'],            requirement: {},              points: 2 },
  { id: 8,  name: '노을 초원',   illustration: 'flower',   rewards: ['day', 'shell'],            requirement: {},              points: 2 },
  { id: 9,  name: '이끼 산길',   illustration: 'mountain', rewards: ['forest', 'moon'],          requirement: {},              points: 3 },
  { id: 10, name: '옅은 안개숲', illustration: 'forest',   rewards: ['forest', 'shell'],         requirement: {},              points: 3 },

  // ── Mid tier (11–20) — small conditions, decent rewards ──────────────
  { id: 11, name: '풍우의 능선', illustration: 'mountain', rewards: ['day', 'moon'],             requirement: { shell: 1 },    points: 5 },
  { id: 12, name: '매화 정원',   illustration: 'flower',   rewards: ['day', 'shell'],            requirement: { forest: 1 },   points: 5 },
  { id: 13, name: '코이 연못',   illustration: 'water',    rewards: ['shell', 'shell'],          requirement: {},              points: 4 },
  { id: 14, name: '이끼 사원',   illustration: 'ruin',     rewards: ['feather', 'moon'],         requirement: { moon: 1 },     points: 6 },
  { id: 15, name: '반딧불 계곡', illustration: 'forest',   rewards: ['moon', 'forest'],          requirement: { day: 1 },      points: 6 },
  { id: 16, name: '잊혀진 신단', illustration: 'ruin',     rewards: ['feather'],                 requirement: { moon: 2 },     points: 7 },
  { id: 17, name: '흰 사구',     illustration: 'flower',   rewards: ['day'],                     requirement: { shell: 2 },    points: 7 },
  { id: 18, name: '겨울 폭포',   illustration: 'water',    rewards: ['shell', 'feather'],        requirement: {},              points: 5 },
  { id: 19, name: '새벽의 신탁', illustration: 'ruin',     rewards: ['day', 'moon'],             requirement: { forest: 1 },   points: 7 },
  { id: 20, name: '고원 협곡',   illustration: 'mountain', rewards: ['forest', 'feather'],       requirement: { moon: 1 },     points: 7 },

  // ── High tier (21–30) — big conditional points, scarce rewards ───────
  { id: 21, name: '가을 잔불',   illustration: 'flower',   rewards: ['day'],                     requirement: { moon: 2, shell: 1 }, points: 10 },
  { id: 22, name: '숨은 폭포',   illustration: 'water',    rewards: ['moon'],                    requirement: { shell: 3 },    points: 10 },
  { id: 23, name: '별관측대',    illustration: 'mountain', rewards: ['moon', 'moon'],            requirement: {},              points: 6 },
  { id: 24, name: '태고의 옥좌', illustration: 'ruin',     rewards: ['feather'],                 requirement: { day: 2 },      points: 10 },
  { id: 25, name: '침묵의 숲',   illustration: 'forest',   rewards: ['forest'],                  requirement: { feather: 1 },  points: 9 },
  { id: 26, name: '천상의 다리', illustration: 'mountain', rewards: [],                          requirement: { moon: 3 },     points: 12 },
  { id: 27, name: '오래된 도서관', illustration: 'ruin',   rewards: ['feather'],                 requirement: { shell: 2, forest: 1 }, points: 12 },
  { id: 28, name: '보름달 사원', illustration: 'ruin',     rewards: [],                          requirement: { moon: 4 },     points: 15 },
  { id: 29, name: '조수 협곡',   illustration: 'water',    rewards: ['moon'],                    requirement: { day: 2, shell: 1 }, points: 12 },
  { id: 30, name: '은빛 폭포',   illustration: 'water',    rewards: ['feather'],                 requirement: { moon: 3 },     points: 15 },
] as const

export function cardById(id: number): RegionCard {
  const c = REGION_CARDS.find((c) => c.id === id)
  if (!c) throw new Error(`Unknown region card #${id}`)
  return c
}
