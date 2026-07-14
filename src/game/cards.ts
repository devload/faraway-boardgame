import type { RegionCard } from './types.ts'

/**
 * Region card pool (48 cards, numbers 1..48).
 *
 * We keep the pool below the original's 68 but push it well past the
 * initial 30-card MVP: with 2 players consuming 16 cards + up to 8 in
 * the market over the match, 48 leaves > 20 cards unseen every game →
 * enough replay variety without diluting the tuning bell curve.
 *
 * Design intent (same as before, extended by tier):
 *   • Low numbers (1-14)   flat scorers, generous reward icons,
 *                          predominantly DAY. A couple carry a clue
 *                          because losing sanctuary access on R1 is
 *                          fine but early clues are still valuable.
 *   • Mid numbers (15-32)  transition; small quests, a few night cards,
 *                          the bulk of the clue supply lives here.
 *   • High numbers (33-48) mostly NIGHT, heavy quest requirements,
 *                          scarce rewards. Best on the RIGHT of the
 *                          tableau where left-side icons can satisfy.
 *
 * Icon scarcity (rewards, 48-card pool):
 *   shell   ×18     forest  ×12   moon    × 8
 *   day     × 8     feather × 5   ← rarest, big-quest gate
 *
 * Night count: 22/48 (~46%, matching the original's night ratio).
 * Clue supply: 8 (across ids 6, 13, 15, 22, 28, 33, 40, 47).
 * Illustration mix: mountain×9 · water×12 · forest×7 · flower×8 · ruin×12
 */
export const REGION_CARDS: readonly RegionCard[] = [
  // ── Low tier (1–10) — mostly DAY, flat scorers, icon suppliers ────────
  { id: 1,  name: '아침 언덕',   subtitle: '햇살이 처음 닿는 곳',   illustration: 'mountain', isNight: false, rewards: ['shell'],                   clues: 0, requirement: {},              points: 1 },
  { id: 2,  name: '고요한 만',   subtitle: '파도가 잠든 항구',      illustration: 'water',    isNight: false, rewards: ['shell'],                   clues: 0, requirement: {},              points: 1 },
  { id: 3,  name: '이슬 정원',   subtitle: '아침이 반짝이는 뜰',    illustration: 'flower',   isNight: false, rewards: ['shell', 'day'],            clues: 0, requirement: {},              points: 2 },
  { id: 4,  name: '푸른 소로',   subtitle: '오래된 산책길',         illustration: 'forest',   isNight: false, rewards: ['forest'],                  clues: 0, requirement: {},              points: 2 },
  { id: 5,  name: '새벽 만',     subtitle: '첫 배가 뜨는 물목',     illustration: 'water',    isNight: false, rewards: ['shell', 'shell'],          clues: 0, requirement: {},              points: 2 },
  { id: 6,  name: '옛 문루',     subtitle: '잊혀진 관문 · 지도가 있다', illustration: 'ruin', isNight: false, rewards: ['feather'],                 clues: 1, requirement: {},              points: 2 },
  { id: 7,  name: '별의 못',     subtitle: '밤이 담긴 웅덩이',      illustration: 'water',    isNight: true,  rewards: ['moon'],                    clues: 0, requirement: {},              points: 2 },
  { id: 8,  name: '노을 초원',   subtitle: '해질녘 풀밭',           illustration: 'flower',   isNight: false, rewards: ['day', 'shell'],            clues: 0, requirement: {},              points: 3 },
  { id: 9,  name: '이끼 산길',   subtitle: '숲 위로 이어진 길',     illustration: 'mountain', isNight: false, rewards: ['forest'],                  clues: 0, requirement: { shell: 1 },    points: 4 },
  { id: 10, name: '옅은 안개숲', subtitle: '아침 안개의 숲',        illustration: 'forest',   isNight: false, rewards: ['forest', 'shell'],         clues: 0, requirement: {},              points: 3 },

  // ── Mid tier (11–20) — mixed timing, most clues live here ─────────────
  { id: 11, name: '풍우의 능선', subtitle: '바람이 쉬는 정상',      illustration: 'mountain', isNight: false, rewards: ['day', 'shell'],            clues: 0, requirement: { shell: 1 },    points: 5 },
  { id: 12, name: '매화 정원',   subtitle: '봄이 잊혀지지 않은 곳', illustration: 'flower',   isNight: false, rewards: ['day', 'shell'],            clues: 0, requirement: { forest: 1 },   points: 5 },
  { id: 13, name: '코이 연못',   subtitle: '비단잉어의 저수 · 지도가 있다', illustration: 'water', isNight: false, rewards: ['shell'],             clues: 1, requirement: {},              points: 4 },
  { id: 14, name: '이끼 사원',   subtitle: '녹빛으로 뒤덮인 성소',  illustration: 'ruin',     isNight: true,  rewards: ['feather'],                 clues: 0, requirement: { moon: 1 },     points: 6 },
  { id: 15, name: '반딧불 계곡', subtitle: '별이 내려앉은 골짜기 · 지도가 있다', illustration: 'forest', isNight: true, rewards: ['forest'],       clues: 1, requirement: { day: 1 },      points: 6 },
  { id: 16, name: '잊혀진 신단', subtitle: '아무도 찾지 않는 제단', illustration: 'ruin',     isNight: true,  rewards: ['moon'],                    clues: 0, requirement: { shell: 2 },    points: 7 },
  { id: 17, name: '흰 사구',     subtitle: '달빛 아래의 모래',      illustration: 'flower',   isNight: true,  rewards: ['moon'],                    clues: 0, requirement: { day: 1 },      points: 6 },
  { id: 18, name: '겨울 폭포',   subtitle: '얼음이 흐르는 벽',      illustration: 'water',    isNight: false, rewards: ['shell', 'feather'],        clues: 0, requirement: {},              points: 5 },
  { id: 19, name: '새벽의 신탁', subtitle: '첫 빛이 답을 주는 곳',  illustration: 'ruin',     isNight: false, rewards: ['day', 'day'],              clues: 0, requirement: { forest: 1 },   points: 7 },
  { id: 20, name: '고원 협곡',   subtitle: '바람이 조각한 벼랑',    illustration: 'mountain', isNight: true,  rewards: ['forest'],                  clues: 0, requirement: { moon: 1 },     points: 7 },

  // ── High tier (21–30) — mostly NIGHT, heavy quests, scarce rewards ────
  { id: 21, name: '가을 잔불',   subtitle: '마지막 온기의 정원',    illustration: 'flower',   isNight: true,  rewards: ['moon'],                    clues: 0, requirement: { shell: 3 },    points: 9 },
  { id: 22, name: '숨은 폭포',   subtitle: '지도에 없는 물줄기 · 지도가 있다', illustration: 'water', isNight: false, rewards: [],                   clues: 1, requirement: { shell: 2 },    points: 8 },
  { id: 23, name: '별관측대',    subtitle: '밤이 오는 언덕',        illustration: 'mountain', isNight: true,  rewards: ['moon'],                    clues: 0, requirement: {},              points: 6 },
  { id: 24, name: '태고의 옥좌', subtitle: '지워진 왕의 자리',      illustration: 'ruin',     isNight: false, rewards: [],                          clues: 0, requirement: { day: 2, feather: 1 }, points: 12 },
  { id: 25, name: '침묵의 숲',   subtitle: '노래가 그친 대지',      illustration: 'forest',   isNight: true,  rewards: ['forest'],                  clues: 0, requirement: { feather: 1 },  points: 9 },
  { id: 26, name: '천상의 다리', subtitle: '구름을 가로지르는 길',  illustration: 'mountain', isNight: true,  rewards: [],                          clues: 0, requirement: { moon: 2, shell: 1 }, points: 12 },
  { id: 27, name: '오래된 도서관', subtitle: '먼지 속에 잠든 지혜', illustration: 'ruin',     isNight: false, rewards: ['feather'],                 clues: 0, requirement: { shell: 2, forest: 1 }, points: 12 },
  { id: 28, name: '보름달 사원', subtitle: '한 달에 한 번 열리는 문 · 지도가 있다', illustration: 'ruin', isNight: true, rewards: [],              clues: 1, requirement: { moon: 3 },     points: 14 },
  { id: 29, name: '조수 협곡',   subtitle: '두 바다가 만나는 골',   illustration: 'water',    isNight: true,  rewards: [],                          clues: 0, requirement: { day: 2, shell: 1 }, points: 13 },
  { id: 30, name: '은빛 폭포',   subtitle: '다섯 번째 여명의 폭포', illustration: 'water',    isNight: true,  rewards: [],                          clues: 0, requirement: { moon: 3, forest: 1 }, points: 16 },

  // ── Expansion pack (31–48) — fills out replay variety across all tiers ─
  // Low fillers (31–34) — DAY, generous rewards, weave more icon supply
  //                       into the pool so mid-quests can trigger more often.
  { id: 31, name: '샘솟는 뜰',   subtitle: '이름 없는 우물의 정원',  illustration: 'flower',   isNight: false, rewards: ['shell', 'forest'],         clues: 0, requirement: {},              points: 3 },
  { id: 32, name: '햇살 여울',   subtitle: '얕은 여울에 반짝이는 빛', illustration: 'water',    isNight: false, rewards: ['shell', 'shell'],          clues: 0, requirement: {},              points: 3 },
  { id: 33, name: '지도가 있는 돌', subtitle: '이끼로 덮인 이정표 · 지도가 있다', illustration: 'ruin', isNight: false, rewards: ['day'],              clues: 1, requirement: {},              points: 3 },
  { id: 34, name: '아이리스 언덕', subtitle: '자줏빛 꽃이 도는 능선',  illustration: 'flower',   isNight: false, rewards: ['forest', 'shell'],         clues: 0, requirement: {},              points: 4 },

  // Mid fillers (35–40) — transition tier: small quests, feather supply,
  //                       first night cards. One extra clue.
  { id: 35, name: '녹슨 등탑',   subtitle: '녹빛으로 물든 관문',      illustration: 'ruin',     isNight: false, rewards: ['shell', 'day'],            clues: 0, requirement: { forest: 1 },   points: 5 },
  { id: 36, name: '고사리 협로', subtitle: '왼발 발자국의 오솔길',    illustration: 'forest',   isNight: false, rewards: ['forest', 'forest'],        clues: 0, requirement: {},              points: 5 },
  { id: 37, name: '고요한 여울', subtitle: '별이 가라앉은 물결',      illustration: 'water',    isNight: true,  rewards: ['shell'],                   clues: 0, requirement: { moon: 1 },     points: 6 },
  { id: 38, name: '만월 능선',   subtitle: '한 밤의 등뼈',            illustration: 'mountain', isNight: true,  rewards: ['moon'],                    clues: 0, requirement: { shell: 1 },    points: 6 },
  { id: 39, name: '해국 정원',   subtitle: '바닷바람에 피는 꽃',      illustration: 'flower',   isNight: false, rewards: ['feather'],                 clues: 0, requirement: { shell: 1 },    points: 7 },
  { id: 40, name: '순례자 오솔길', subtitle: '지도가 반쯤 지워진 길 · 지도가 있다', illustration: 'forest', isNight: false, rewards: ['forest'],       clues: 1, requirement: { day: 1 },      points: 7 },

  // Upper-mid (41–44) — heavier requirements, mostly night.
  { id: 41, name: '별의 능묘',   subtitle: '오래된 왕들이 잠든 곳',   illustration: 'ruin',     isNight: true,  rewards: ['moon'],                    clues: 0, requirement: { forest: 1 },   points: 8 },
  { id: 42, name: '아우로라 봉', subtitle: '오로라가 걸리는 봉우리',  illustration: 'mountain', isNight: true,  rewards: ['moon'],                    clues: 0, requirement: { day: 2 },      points: 9 },
  { id: 43, name: '심연 항구',   subtitle: '바닥이 보이지 않는 만',   illustration: 'water',    isNight: true,  rewards: ['shell'],                   clues: 0, requirement: { moon: 2 },     points: 10 },
  { id: 44, name: '망각의 숲',   subtitle: '이름을 잃은 자들의 숲',   illustration: 'forest',   isNight: true,  rewards: ['forest'],                  clues: 0, requirement: { feather: 1 }, points: 10 },

  // High-end (45–48) — final-round rewards, big quests, sparse icons.
  { id: 45, name: '홍염 폭포',   subtitle: '해질녘의 붉은 물기둥',    illustration: 'water',    isNight: false, rewards: [],                          clues: 0, requirement: { day: 2, forest: 1 }, points: 12 },
  { id: 46, name: '오랜 첨탑',   subtitle: '깨어난 종의 유적',        illustration: 'ruin',     isNight: true,  rewards: [],                          clues: 0, requirement: { shell: 2, moon: 2 }, points: 13 },
  { id: 47, name: '별지도의 방', subtitle: '별자리가 새겨진 회랑 · 지도가 있다', illustration: 'ruin', isNight: true, rewards: [],                    clues: 1, requirement: { moon: 2, feather: 1 }, points: 14 },
  { id: 48, name: '여명의 계단', subtitle: '첫 빛에 이르는 길',       illustration: 'mountain', isNight: true,  rewards: [],                          clues: 0, requirement: { moon: 4, day: 1 }, points: 17 },
] as const

export function cardById(id: number): RegionCard {
  const c = REGION_CARDS.find((c) => c.id === id)
  if (!c) throw new Error(`Unknown region card #${id}`)
  return c
}
