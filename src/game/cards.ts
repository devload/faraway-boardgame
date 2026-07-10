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
  { id: 1,  name: '아침 언덕',   subtitle: '햇살이 처음 닿는 곳',   illustration: 'mountain', rewards: ['moon'],                    requirement: {},              points: 1 },
  { id: 2,  name: '고요한 만',   subtitle: '파도가 잠든 항구',      illustration: 'water',    rewards: ['shell'],                   requirement: {},              points: 1 },
  { id: 3,  name: '이슬 정원',   subtitle: '아침이 반짝이는 뜰',    illustration: 'flower',   rewards: ['moon', 'shell'],           requirement: {},              points: 2 },
  { id: 4,  name: '푸른 소로',   subtitle: '오래된 산책길',         illustration: 'forest',   rewards: ['forest'],                  requirement: {},              points: 2 },
  { id: 5,  name: '새벽 만',     subtitle: '첫 배가 뜨는 물목',     illustration: 'water',    rewards: ['shell', 'moon'],           requirement: {},              points: 2 },
  { id: 6,  name: '옛 문루',     subtitle: '잊혀진 관문',           illustration: 'ruin',     rewards: ['feather'],                 requirement: {},              points: 3 },
  { id: 7,  name: '별의 못',     subtitle: '밤이 담긴 웅덩이',      illustration: 'water',    rewards: ['moon', 'moon'],            requirement: {},              points: 2 },
  { id: 8,  name: '노을 초원',   subtitle: '해질녘 풀밭',           illustration: 'flower',   rewards: ['day', 'shell'],            requirement: {},              points: 2 },
  { id: 9,  name: '이끼 산길',   subtitle: '숲 위로 이어진 길',     illustration: 'mountain', rewards: ['forest', 'moon'],          requirement: {},              points: 3 },
  { id: 10, name: '옅은 안개숲', subtitle: '아침 안개의 숲',        illustration: 'forest',   rewards: ['forest', 'shell'],         requirement: {},              points: 3 },

  // ── Mid tier (11–20) — small conditions, decent rewards ──────────────
  { id: 11, name: '풍우의 능선', subtitle: '바람이 쉬는 정상',      illustration: 'mountain', rewards: ['day', 'moon'],             requirement: { shell: 1 },    points: 5 },
  { id: 12, name: '매화 정원',   subtitle: '봄이 잊혀지지 않은 곳', illustration: 'flower',   rewards: ['day', 'shell'],            requirement: { forest: 1 },   points: 5 },
  { id: 13, name: '코이 연못',   subtitle: '비단잉어의 저수',       illustration: 'water',    rewards: ['shell', 'shell'],          requirement: {},              points: 4 },
  { id: 14, name: '이끼 사원',   subtitle: '녹빛으로 뒤덮인 성소',  illustration: 'ruin',     rewards: ['feather', 'moon'],         requirement: { moon: 1 },     points: 6 },
  { id: 15, name: '반딧불 계곡', subtitle: '별이 내려앉은 골짜기',  illustration: 'forest',   rewards: ['moon', 'forest'],          requirement: { day: 1 },      points: 6 },
  { id: 16, name: '잊혀진 신단', subtitle: '아무도 찾지 않는 제단', illustration: 'ruin',     rewards: ['feather'],                 requirement: { moon: 2 },     points: 7 },
  { id: 17, name: '흰 사구',     subtitle: '달빛 아래의 모래',      illustration: 'flower',   rewards: ['day'],                     requirement: { shell: 2 },    points: 7 },
  { id: 18, name: '겨울 폭포',   subtitle: '얼음이 흐르는 벽',      illustration: 'water',    rewards: ['shell', 'feather'],        requirement: {},              points: 5 },
  { id: 19, name: '새벽의 신탁', subtitle: '첫 빛이 답을 주는 곳',  illustration: 'ruin',     rewards: ['day', 'moon'],             requirement: { forest: 1 },   points: 7 },
  { id: 20, name: '고원 협곡',   subtitle: '바람이 조각한 벼랑',    illustration: 'mountain', rewards: ['forest', 'feather'],       requirement: { moon: 1 },     points: 7 },

  // ── High tier (21–30) — big conditional points, scarce rewards ───────
  { id: 21, name: '가을 잔불',   subtitle: '마지막 온기의 정원',    illustration: 'flower',   rewards: ['day'],                     requirement: { moon: 2, shell: 1 }, points: 10 },
  { id: 22, name: '숨은 폭포',   subtitle: '지도에 없는 물줄기',    illustration: 'water',    rewards: ['moon'],                    requirement: { shell: 3 },    points: 10 },
  { id: 23, name: '별관측대',    subtitle: '밤이 오는 언덕',        illustration: 'mountain', rewards: ['moon', 'moon'],            requirement: {},              points: 6 },
  { id: 24, name: '태고의 옥좌', subtitle: '지워진 왕의 자리',      illustration: 'ruin',     rewards: ['feather'],                 requirement: { day: 2 },      points: 10 },
  { id: 25, name: '침묵의 숲',   subtitle: '노래가 그친 대지',      illustration: 'forest',   rewards: ['forest'],                  requirement: { feather: 1 },  points: 9 },
  { id: 26, name: '천상의 다리', subtitle: '구름을 가로지르는 길',  illustration: 'mountain', rewards: [],                          requirement: { moon: 3 },     points: 12 },
  { id: 27, name: '오래된 도서관', subtitle: '먼지 속에 잠든 지혜', illustration: 'ruin',     rewards: ['feather'],                 requirement: { shell: 2, forest: 1 }, points: 12 },
  { id: 28, name: '보름달 사원', subtitle: '한 달에 한 번 열리는 문', illustration: 'ruin',   rewards: [],                          requirement: { moon: 4 },     points: 15 },
  { id: 29, name: '조수 협곡',   subtitle: '두 바다가 만나는 골',   illustration: 'water',    rewards: ['moon'],                    requirement: { day: 2, shell: 1 }, points: 12 },
  { id: 30, name: '은빛 폭포',   subtitle: '다섯 번째 여명의 폭포', illustration: 'water',    rewards: ['feather'],                 requirement: { moon: 3 },     points: 15 },
] as const

export function cardById(id: number): RegionCard {
  const c = REGION_CARDS.find((c) => c.id === id)
  if (!c) throw new Error(`Unknown region card #${id}`)
  return c
}
