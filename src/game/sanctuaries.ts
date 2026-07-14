import type { SanctuaryCard, SanctuaryScoreCtx } from './types.ts'

/**
 * Sanctuary cards — the "bonus" deck (24 cards).
 *
 * Every sanctuary in the original has TWO scoring halves:
 *   • Top    "immediate" bonus — usually a resource multiplier, a night-
 *            count multiplier, or an instant Clue that raises the number
 *            of sanctuaries you draw next round.
 *   • Bottom "side-quest"     — a pattern check across your tableau
 *            (odd/even numbers, quest cards, distinct icons, …).
 *
 * At end of game a sanctuary contributes topScore + bottomScore.
 *
 * The `clues` field represents Clue pictograms printed on the sanctuary
 * itself — they increase the draw size in future rounds.
 *
 * `supplies` field: a small subset of sanctuaries print icons in their
 * corner (per the original). Once acquired, those icons feed the
 * LEFT-side totals of every region — effectively unlocking gate quests
 * that would otherwise be unreachable. Ids 21–24 are the "gate-opener"
 * sanctuaries in this pool.
 */

/** Convenience: total icon count in ctx (used by most top-halves). */
const iconCount = (ctx: SanctuaryScoreCtx, icon: keyof SanctuaryScoreCtx['iconTotals']) =>
  ctx.iconTotals[icon]

/** Cards with any icon requirement (side-quest style bottoms). */
const questCards = (ctx: SanctuaryScoreCtx) =>
  ctx.tableau.filter((c) => Object.keys(c.requirement).length > 0).length

const distinctIcons = (ctx: SanctuaryScoreCtx) =>
  (Object.keys(ctx.iconTotals) as (keyof SanctuaryScoreCtx['iconTotals'])[])
    .filter((k) => ctx.iconTotals[k] > 0).length

export const SANCTUARY_CARDS: readonly SanctuaryCard[] = [
  // ── Resource-multiplier tops paired with pattern bottoms ─────────────
  {
    id: 1,
    name: '달빛 성소',
    topLabel: '🌙 아이콘 1개당 +2점',
    bottomLabel: '홀수 번호 지역 1장당 +2점',
    clues: 0,
    topScoreFn: (ctx) => iconCount(ctx, 'moon') * 2,
    bottomScoreFn: (ctx) => ctx.tableau.filter((c) => c.id % 2 === 1).length * 2,
  },
  {
    id: 2,
    name: '태양의 신전',
    topLabel: '☀️ 아이콘 1개당 +3점',
    bottomLabel: '조건 있는 지역 1장당 +2점',
    clues: 0,
    topScoreFn: (ctx) => iconCount(ctx, 'day') * 3,
    bottomScoreFn: (ctx) => questCards(ctx) * 2,
  },
  {
    id: 3,
    name: '조개의 사당',
    topLabel: '🐚 아이콘 1개당 +2점',
    bottomLabel: '짝수 번호 지역 1장당 +2점',
    clues: 0,
    topScoreFn: (ctx) => iconCount(ctx, 'shell') * 2,
    bottomScoreFn: (ctx) => ctx.tableau.filter((c) => c.id % 2 === 0).length * 2,
  },
  {
    id: 4,
    name: '깃털 문루',
    topLabel: '🪶 아이콘 1개당 +4점',
    bottomLabel: '고득점 카드 1장당 +3점 (10점 이상 지역)',
    clues: 0,
    topScoreFn: (ctx) => iconCount(ctx, 'feather') * 4,
    bottomScoreFn: (ctx) => ctx.tableau.filter((c) => c.points >= 10).length * 3,
  },
  {
    id: 5,
    name: '숲의 은신처',
    topLabel: '🌲 아이콘 1개당 +3점',
    bottomLabel: '아이콘 종류 1개당 +2점',
    clues: 0,
    topScoreFn: (ctx) => iconCount(ctx, 'forest') * 3,
    bottomScoreFn: (ctx) => distinctIcons(ctx) * 2,
  },
  // ── Night-focused sanctuaries — reward big Night tableau ─────────────
  {
    id: 6,
    name: '무월당',
    topLabel: '밤 카드 1장당 +3점',
    bottomLabel: '가장 큰 번호 × 0.3점',
    clues: 0,
    topScoreFn: (ctx) => ctx.nightCount * 3,
    bottomScoreFn: (ctx) => Math.floor(Math.max(0, ...ctx.tableau.map((c) => c.id)) * 0.3),
  },
  {
    id: 7,
    name: '일출의 방',
    topLabel: '낮 카드 1장당 +2점',
    bottomLabel: '가장 작은 번호가 5 이하면 +6점',
    clues: 0,
    topScoreFn: (ctx) => ctx.dayCount * 2,
    bottomScoreFn: (ctx) => {
      const min = Math.min(...ctx.tableau.map((c) => c.id))
      return Number.isFinite(min) && min <= 5 ? 6 : 0
    },
  },
  // ── Clue-supplying sanctuaries (immediate effect) ────────────────────
  {
    id: 8,
    name: '순례의 지도',
    topLabel: '지도(단서) 1장당 +2점',
    bottomLabel: '숲 지형 1장당 +2점',
    clues: 1,
    topScoreFn: (ctx) => ctx.tableau.reduce((s, c) => s + c.clues, 0) * 2,
    bottomScoreFn: (ctx) => ctx.tableau.filter((c) => c.illustration === 'forest').length * 2,
  },
  {
    id: 9,
    name: '방랑자의 노트',
    topLabel: '유적 지형 1장당 +3점',
    bottomLabel: '조건 없는 지역 1장당 +2점',
    clues: 1,
    topScoreFn: (ctx) => ctx.tableau.filter((c) => c.illustration === 'ruin').length * 3,
    bottomScoreFn: (ctx) => ctx.tableau.filter((c) => Object.keys(c.requirement).length === 0).length * 2,
  },
  // ── Pattern & structure sanctuaries ──────────────────────────────────
  {
    id: 10,
    name: '조우의 광장',
    topLabel: '조건 있는 지역 1장당 +3점',
    bottomLabel: '아이콘 종류 5개면 +8점',
    clues: 0,
    topScoreFn: (ctx) => questCards(ctx) * 3,
    bottomScoreFn: (ctx) => distinctIcons(ctx) >= 5 ? 8 : 0,
  },
  {
    id: 11,
    name: '무지개 봉우리',
    topLabel: '산 지형 1장당 +3점',
    bottomLabel: '아이콘 종류 1개당 +3점',
    clues: 0,
    topScoreFn: (ctx) => ctx.tableau.filter((c) => c.illustration === 'mountain').length * 3,
    bottomScoreFn: (ctx) => distinctIcons(ctx) * 3,
  },
  {
    id: 12,
    name: '만조의 신전',
    topLabel: '물 지형 1장당 +3점',
    bottomLabel: '🐚 4개 이상이면 +8점',
    clues: 0,
    topScoreFn: (ctx) => ctx.tableau.filter((c) => c.illustration === 'water').length * 3,
    bottomScoreFn: (ctx) => iconCount(ctx, 'shell') >= 4 ? 8 : 0,
  },
  {
    id: 13,
    name: '유월의 화원',
    topLabel: '꽃 지형 1장당 +3점',
    bottomLabel: '☀️ 3개 이상이면 +7점',
    clues: 0,
    topScoreFn: (ctx) => ctx.tableau.filter((c) => c.illustration === 'flower').length * 3,
    bottomScoreFn: (ctx) => iconCount(ctx, 'day') >= 3 ? 7 : 0,
  },
  {
    id: 14,
    name: '망각의 문',
    topLabel: '지역 8장이면 +10점, 아니면 +0',
    bottomLabel: '유적 2장 이상이면 +6점',
    clues: 0,
    topScoreFn: (ctx) => ctx.tableau.length >= 8 ? 10 : 0,
    bottomScoreFn: (ctx) => ctx.tableau.filter((c) => c.illustration === 'ruin').length >= 2 ? 6 : 0,
  },
  {
    id: 15,
    name: '별의 나선',
    topLabel: '🌙 3개 이상이면 +8점',
    bottomLabel: '🌙 5개 이상이면 추가 +6점',
    clues: 0,
    topScoreFn: (ctx) => iconCount(ctx, 'moon') >= 3 ? 8 : 0,
    bottomScoreFn: (ctx) => iconCount(ctx, 'moon') >= 5 ? 6 : 0,
  },
  {
    id: 16,
    name: '광채의 회랑',
    topLabel: '🪶 2개 이상이면 +8점',
    bottomLabel: '20 이상 번호 카드 1장당 +2점',
    clues: 0,
    topScoreFn: (ctx) => iconCount(ctx, 'feather') >= 2 ? 8 : 0,
    bottomScoreFn: (ctx) => ctx.tableau.filter((c) => c.id >= 20).length * 2,
  },
  {
    id: 17,
    name: '고요의 회당',
    topLabel: '10 미만 번호 카드 1장당 +3점',
    bottomLabel: '가장 큰-가장 작은 번호 차 × 0.3점',
    clues: 0,
    topScoreFn: (ctx) => ctx.tableau.filter((c) => c.id < 10).length * 3,
    bottomScoreFn: (ctx) => {
      if (ctx.tableau.length < 2) return 0
      const ids = ctx.tableau.map((c) => c.id)
      return Math.floor((Math.max(...ids) - Math.min(...ids)) * 0.3)
    },
  },
  {
    id: 18,
    name: '거울의 방',
    topLabel: '성소 카드 1장당 +2점 (자기 포함)',
    bottomLabel: '지역 6장 이상이면 +4점',
    clues: 0,
    topScoreFn: (ctx) => ctx.sanctuaries.length * 2,
    bottomScoreFn: (ctx) => ctx.tableau.length >= 6 ? 4 : 0,
  },
  {
    id: 19,
    name: '여명의 축배',
    topLabel: '낮·밤 카드 합이 5 이상이면 +6점, 8 이상이면 +12점',
    bottomLabel: '조건 없는 지역 3장 이상이면 +5점',
    clues: 0,
    topScoreFn: (ctx) => {
      const both = ctx.dayCount + ctx.nightCount
      if (both >= 8) return 12
      if (both >= 5) return 6
      return 0
    },
    bottomScoreFn: (ctx) => ctx.tableau.filter((c) => Object.keys(c.requirement).length === 0).length >= 3 ? 5 : 0,
  },
  {
    id: 20,
    name: '순환의 상',
    topLabel: '🐚 · 🌲 · 🪶 각 1개 이상이면 +7점',
    bottomLabel: '☀️ · 🌙 둘 다 있으면 +5점',
    clues: 0,
    topScoreFn: (ctx) =>
      iconCount(ctx, 'shell') > 0 && iconCount(ctx, 'forest') > 0 && iconCount(ctx, 'feather') > 0 ? 7 : 0,
    bottomScoreFn: (ctx) =>
      iconCount(ctx, 'day') > 0 && iconCount(ctx, 'moon') > 0 ? 5 : 0,
  },

  // ── Gate-opener sanctuaries (21–24) — inject icons into left-side totals
  //   These let you satisfy region quests whose required icons never showed
  //   up in your tableau, at the cost of the "safer" pattern sanctuaries.
  //   Top halves are intentionally moderate — the real value is the supply.
  {
    id: 21,
    name: '고대 유물함',
    topLabel: '🐚 아이콘 1개당 +2점',
    bottomLabel: '유적·산 지형 각 1장 이상이면 +5점',
    clues: 0,
    supplies: ['shell'],
    topScoreFn: (ctx) => iconCount(ctx, 'shell') * 2,
    bottomScoreFn: (ctx) => {
      const ruin = ctx.tableau.some((c) => c.illustration === 'ruin')
      const mountain = ctx.tableau.some((c) => c.illustration === 'mountain')
      return ruin && mountain ? 5 : 0
    },
  },
  {
    id: 22,
    name: '숲의 노래',
    topLabel: '🌲 아이콘 1개당 +2점',
    bottomLabel: '조건 있는 지역 3장 이상이면 +6점',
    clues: 0,
    supplies: ['forest'],
    topScoreFn: (ctx) => iconCount(ctx, 'forest') * 2,
    bottomScoreFn: (ctx) => questCards(ctx) >= 3 ? 6 : 0,
  },
  {
    id: 23,
    name: '달의 눈',
    topLabel: '밤 카드 1장당 +2점',
    bottomLabel: '🌙 5개 이상이면 +6점',
    clues: 0,
    supplies: ['moon', 'moon'],
    topScoreFn: (ctx) => ctx.nightCount * 2,
    bottomScoreFn: (ctx) => iconCount(ctx, 'moon') >= 5 ? 6 : 0,
  },
  {
    id: 24,
    name: '밝은 등대',
    topLabel: '🪶 아이콘 1개당 +3점',
    bottomLabel: '낮 카드 3장 이상이면 +5점',
    clues: 0,
    supplies: ['feather'],
    topScoreFn: (ctx) => iconCount(ctx, 'feather') * 3,
    bottomScoreFn: (ctx) => ctx.dayCount >= 3 ? 5 : 0,
  },
]

export function sanctuaryById(id: number): SanctuaryCard {
  const s = SANCTUARY_CARDS.find((s) => s.id === id)
  if (!s) throw new Error(`Unknown sanctuary #${id}`)
  return s
}
