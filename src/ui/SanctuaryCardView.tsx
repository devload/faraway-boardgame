import type { SanctuaryCard, Icon } from '../game/types.ts'
import { ICON_EMOJI } from '../game/types.ts'

/**
 * Sanctuary card view — top/bottom visually distinct halves.
 *
 * The original Faraway sanctuary cards split the face into two colored
 * zones separated by a metallic line:
 *   • Top: "immediate" bonus (usually a resource multiplier). Rendered on
 *          a warm parchment amber field with a Cinzel label.
 *   • Bottom: "side-quest" against tableau patterns. Rendered on a cool
 *            mist-blue field so the two halves read as separate rules.
 * A thin gold divider sits between them.
 *
 * Variants:
 *   • size 'sm' — used in the results ceremony (compact)
 *   • size 'md' — used in the draft chooser (larger, tap-friendly)
 *
 * Optional overlays:
 *   • topScore / bottomScore — after scoring reveals, we show a +N badge
 *                              tucked into each half.
 *   • selected / dim         — for the draft UI states.
 */
export function SanctuaryCardView({
  card,
  size = 'md',
  onClick,
  selected = false,
  dim = false,
  topScore,
  bottomScore,
  revealed = true,
}: {
  card: SanctuaryCard
  size?: 'sm' | 'md'
  onClick?: () => void
  selected?: boolean
  dim?: boolean
  topScore?: number
  bottomScore?: number
  /** If false, render at reduced opacity as an unfired sanctuary. */
  revealed?: boolean
}) {
  const dims = size === 'sm'
    ? { w: 'w-[160px]', h: 'h-[140px]', title: 'text-[11px]', label: 'text-[9px]', badge: 'text-[10px]' }
    : { w: 'w-[168px]', h: 'h-[168px]', title: 'text-[12px]', label: 'text-[10px]', badge: 'text-[11px]' }

  const hasSupplies = card.supplies && card.supplies.length > 0

  return (
    <div
      onClick={onClick}
      className={`relative flex flex-col ${dims.w} ${dims.h} rounded-lg overflow-hidden
                  border-2 border-earth-brown/80 shadow-parchment
                  ${onClick ? 'cursor-pointer transition-transform hover:-translate-y-1' : ''}
                  ${selected ? 'ring-2 ring-gold ring-offset-2 ring-offset-parch-cream -translate-y-1' : ''}
                  ${dim ? 'opacity-45' : ''}
                  ${!revealed ? 'opacity-40' : ''}`}
    >
      {/* Title strip */}
      <div className="relative px-2 py-1 bg-night-indigo/95 flex items-center justify-between">
        <div className={`font-serif italic font-semibold text-parch-cream ${dims.title} leading-tight truncate`}>
          {card.name}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {hasSupplies && (
            <span className="emoji text-[10px] leading-none px-1 rounded-sm bg-gold/25 text-parch-cream"
                  title="이 성소가 공급하는 아이콘 (왼쪽 카운트에 합산됨)">
              {card.supplies!.map((s: Icon) => ICON_EMOJI[s]).join('')}
            </span>
          )}
          {card.clues > 0 && (
            <span className="text-[10px] leading-none px-1 rounded-sm bg-mist-blue/25 text-parch-cream"
                  title="지도(단서) 아이콘">
              📜{card.clues > 1 && <span className="font-mono text-[8px]">×{card.clues}</span>}
            </span>
          )}
        </div>
      </div>

      {/* Top half — warm amber */}
      <div className="relative flex-1 px-2 py-1.5 flex flex-col gap-0.5"
           style={{ background: 'linear-gradient(160deg, #f3d7a8 0%, #ecc38b 55%, #d4a574 100%)' }}>
        <div className="font-mono text-[8px] tracking-widest uppercase text-earth-brown/80">
          ✦ 상단 · 즉시 보너스
        </div>
        <div className={`font-serif text-night-indigo leading-snug ${dims.label} pr-8`}>
          {card.topLabel}
        </div>
        {topScore != null && topScore > 0 && (
          <div className={`absolute bottom-1 right-1 font-display font-bold text-gold ${dims.badge}
                          bg-night-indigo/85 rounded-sm px-1.5 py-0.5 leading-none`}
               style={{ textShadow: '0 0 6px rgba(212,165,116,0.6)' }}>
            +{topScore}
          </div>
        )}
        {topScore === 0 && (
          <div className={`absolute bottom-1 right-1 font-mono ${dims.badge}
                          text-earth-brown bg-parch-cream/70 rounded-sm px-1.5 py-0.5 leading-none`}>
            0
          </div>
        )}
      </div>

      {/* Metallic divider */}
      <div className="relative h-[3px] bg-gradient-to-r from-transparent via-gold to-transparent">
        <div className="absolute inset-0 opacity-60"
             style={{ background: 'linear-gradient(to right, transparent, #d4a574 50%, transparent)' }} />
      </div>

      {/* Bottom half — cool mist */}
      <div className="relative flex-1 px-2 py-1.5 flex flex-col gap-0.5"
           style={{ background: 'linear-gradient(160deg, #d1dde7 0%, #a9c0d3 55%, #7c9bb3 100%)' }}>
        <div className="font-mono text-[8px] tracking-widest uppercase text-night-indigo/70">
          ✧ 하단 · 사이드 퀘스트
        </div>
        <div className={`font-serif text-night-indigo leading-snug ${dims.label} pr-8`}>
          {card.bottomLabel}
        </div>
        {bottomScore != null && bottomScore > 0 && (
          <div className={`absolute bottom-1 right-1 font-display font-bold text-gold ${dims.badge}
                          bg-night-indigo/85 rounded-sm px-1.5 py-0.5 leading-none`}
               style={{ textShadow: '0 0 6px rgba(212,165,116,0.6)' }}>
            +{bottomScore}
          </div>
        )}
        {bottomScore === 0 && (
          <div className={`absolute bottom-1 right-1 font-mono ${dims.badge}
                          text-earth-brown bg-parch-cream/70 rounded-sm px-1.5 py-0.5 leading-none`}>
            0
          </div>
        )}
      </div>
    </div>
  )
}
