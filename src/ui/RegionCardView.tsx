import type { RegionCard } from '../game/types.ts'
import { ICON_EMOJI, ILLUSTRATION_EMOJI } from '../game/types.ts'

const SIZE = {
  xs:  { box: 'w-[70px]',  num: 'text-lg',   name: 'text-[9px]',  h: 'h-[105px]', showBody: true,  compact: true,  illustEm: '20px' },
  sm:  { box: 'w-[92px]',  num: 'text-xl',   name: 'text-[10px]', h: 'h-[138px]', showBody: true,  compact: true,  illustEm: '26px' },
  md:  { box: 'w-[110px]', num: 'text-3xl',  name: 'text-[11px]', h: 'h-[168px]', showBody: true,  compact: false, illustEm: '30px' },
  lg:  { box: 'w-[160px]', num: 'text-5xl',  name: 'text-[14px]', h: 'h-[240px]', showBody: true,  compact: false, illustEm: '44px' },
} as const

/**
 * Painterly illustration backdrops per region type. Uses opaque multi-stop
 * gradients that mirror the mockup vibe: dramatic sunsets for mountains,
 * ocean-to-gold for water, lush greens for forest, coral roses for flower,
 * misty stone tones for ruin. Opacity is 1.0 so the cream parchment
 * doesn't bleed through and mute the palette.
 */
const ILLUSTRATION_BG: Record<RegionCard['illustration'], string> = {
  mountain: 'linear-gradient(155deg, #7c6ba8 0%, #b58ba4 32%, #c48b6e 62%, #d4a574 100%)',
  water:    'linear-gradient(155deg, #4a7ba8 0%, #6ba3c8 40%, #b3c9d4 70%, #d4a574 100%)',
  forest:   'linear-gradient(155deg, #3a5b48 0%, #6b8e5a 40%, #88a065 70%, #a5bd80 100%)',
  flower:   'linear-gradient(155deg, #c48b95 0%, #d9a68a 40%, #f0c8a8 70%, #ffd7a8 100%)',
  ruin:     'linear-gradient(155deg, #4a5c6a 0%, #6b7d8c 32%, #8b6f47 65%, #b8946b 100%)',
}

/**
 * Region card view — Faraway visual language.
 * Big Cinzel number top-left, painterly illustration center, Cormorant
 * italic name mid, condition + reward strip bottom.
 */
export function RegionCardView({
  card,
  size = 'md',
  onClick,
  selected = false,
  dim = false,
}: {
  card: RegionCard
  size?: keyof typeof SIZE
  onClick?: () => void
  selected?: boolean
  dim?: boolean
}) {
  const s = SIZE[size]
  const bg = ILLUSTRATION_BG[card.illustration]
  const hasReq = Object.keys(card.requirement).length > 0

  return (
    <div
      onClick={onClick}
      className={`relative flex flex-col ${s.box} ${s.h} rounded-lg p-2 gap-1.5
                  border-2 border-earth-brown/80
                  bg-gradient-to-b from-parch-light to-parch-warm
                  shadow-parchment
                  ${onClick ? 'cursor-pointer transition-transform hover:-translate-y-1' : ''}
                  ${selected ? 'ring-2 ring-gold ring-offset-2 ring-offset-parch-cream -translate-y-1' : ''}
                  ${dim ? 'opacity-45' : ''}`}
    >
      {/* Top row: number */}
      <div className={`font-display font-bold ${s.num} text-night-indigo leading-none`}>
        {card.id}
      </div>

      {/* Illustration — painterly gradient with soft top-left sheen and
          bottom vignette to give the emoji a bit of depth. */}
      <div className="flex-1 rounded-md flex items-center justify-center relative overflow-hidden"
           style={{
             background: bg,
             filter: 'drop-shadow(0 2px 4px rgba(45,36,56,0.15))',
           }}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/15 to-transparent pointer-events-none" />
        <span className="relative emoji" style={{
          fontSize: s.illustEm,
          filter: 'drop-shadow(0 1px 2px rgba(45,36,56,0.3))',
        }}>
          {ILLUSTRATION_EMOJI[card.illustration]}
        </span>
      </div>

      {/* Name + optional subtitle (md/lg only — too tight at xs/sm) */}
      <div className="text-center">
        <div className={`font-serif italic font-semibold ${s.name} text-night-indigo leading-tight`}>
          {card.name}
        </div>
        {!s.compact && card.subtitle && (
          <div className="font-serif italic text-[9px] text-mist-blue leading-tight mt-0.5 opacity-80">
            {card.subtitle}
          </div>
        )}
      </div>

      {/* Bottom info */}
      {s.showBody && (s.compact ? (
        /* Compact: icons only, still readable at xs/sm. Always shows a
           reward row (even for reward-less cards) so layout is consistent
           and the "no reward" fact is explicit rather than a blank line. */
        <div className="border-t border-earth-brown/25 pt-1 flex flex-col gap-0.5">
          <div className="flex items-center justify-between text-[9px] leading-none">
            <span className="text-earth-brown font-mono emoji">
              {hasReq
                ? Object.entries(card.requirement).map(([icon, n]) => `${ICON_EMOJI[icon as keyof typeof ICON_EMOJI]}${n}`).join('')
                : '·'}
            </span>
            <span className="font-display text-gold font-bold text-xs leading-none"
                  style={{ textShadow: '0 0 4px rgba(212,165,116,0.55)' }}>
              +{card.points}
            </span>
          </div>
          <div className={`text-[10px] text-center leading-none
                          ${card.rewards.length === 0 ? 'text-earth-brown/60 font-mono' : 'text-mist-blue emoji'}`}>
            {card.rewards.length === 0
              ? '↳ 보상 없음'
              : '↳ ' + card.rewards.map((r) => ICON_EMOJI[r]).join('')}
          </div>
        </div>
      ) : (
        /* Full: labeled rows for md/lg. Reward-less cards get a distinct
           mono "없음" so they read as "pure scorer" (won't help future
           cards' conditions — only exists to bank its own points). */
        <div className="border-t border-earth-brown/25 pt-1 flex flex-col gap-0.5">
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-mono text-earth-brown tracking-widest">
              {hasReq ? '조건' : '기본'}
            </span>
            <span className="text-earth-brown emoji">
              {hasReq
                ? Object.entries(card.requirement).map(([icon, n]) => `${ICON_EMOJI[icon as keyof typeof ICON_EMOJI]}×${n}`).join(' ')
                : '—'}
            </span>
            <span className="font-display text-gold font-bold text-sm leading-none"
                  style={{ textShadow: '0 0 4px rgba(212,165,116,0.55)' }}>
              +{card.points}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-mono text-moss-green tracking-widest">보상</span>
            <span className={card.rewards.length === 0
              ? 'text-earth-brown/60 font-mono text-[9px] tracking-wider uppercase'
              : 'text-mist-blue emoji'}>
              {card.rewards.length === 0 ? '없음 · 순수 스코어러' : card.rewards.map((r) => ICON_EMOJI[r]).join(' ')}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
