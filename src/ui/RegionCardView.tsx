import type { RegionCard } from '../game/types.ts'
import { ICON_EMOJI, ILLUSTRATION_EMOJI } from '../game/types.ts'

const SIZE = {
  xs:  { box: 'w-[70px]',  num: 'text-lg',   name: 'text-[9px]',  h: 'h-[105px]', showBody: true,  compact: true  },
  sm:  { box: 'w-[92px]',  num: 'text-xl',   name: 'text-[10px]', h: 'h-[138px]', showBody: true,  compact: true  },
  md:  { box: 'w-[110px]', num: 'text-3xl',  name: 'text-[11px]', h: 'h-[168px]', showBody: true,  compact: false },
  lg:  { box: 'w-[160px]', num: 'text-5xl',  name: 'text-[14px]', h: 'h-[240px]', showBody: true,  compact: false },
} as const

const ILLUSTRATION_BG: Record<RegionCard['illustration'], string> = {
  mountain: 'bg-gradient-to-br from-indigo-300/40 via-sunset/50 to-gold',
  water:    'bg-gradient-to-br from-sky-500/60 via-mist-soft/60 to-gold/70',
  forest:   'bg-gradient-to-br from-emerald-700/50 via-moss-green/70 to-moss-light',
  flower:   'bg-gradient-to-br from-rose-300/60 via-sunset-soft/70 to-gold',
  ruin:     'bg-gradient-to-br from-mist-blue/60 via-earth-brown/60 to-earth-light',
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

      {/* Illustration */}
      <div className={`flex-1 rounded-md ${bg} flex items-center justify-center text-2xl relative overflow-hidden`}
           style={{ filter: 'drop-shadow(0 2px 4px rgba(45,36,56,0.15))' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-transparent pointer-events-none" />
        <span className="relative">{ILLUSTRATION_EMOJI[card.illustration]}</span>
      </div>

      {/* Name */}
      <div className={`font-serif italic ${s.name} text-night-indigo text-center leading-tight`}>
        {card.name}
      </div>

      {/* Bottom info */}
      {s.showBody && (s.compact ? (
        /* Compact: icons only, single-row inline, still readable at xs/sm */
        <div className="border-t border-earth-brown/25 pt-1 flex flex-col gap-0.5">
          <div className="flex items-center justify-between text-[9px] leading-none">
            <span className="text-earth-brown font-mono">
              {hasReq
                ? Object.entries(card.requirement).map(([icon, n]) => `${ICON_EMOJI[icon as keyof typeof ICON_EMOJI]}${n}`).join('')
                : ''}
            </span>
            <span className="font-display text-gold font-bold text-xs leading-none"
                  style={{ textShadow: '0 0 4px rgba(212,165,116,0.55)' }}>
              +{card.points}
            </span>
          </div>
          <div className="text-[10px] text-center leading-none text-mist-blue">
            {card.rewards.length === 0 ? '' : '↳ ' + card.rewards.map((r) => ICON_EMOJI[r]).join('')}
          </div>
        </div>
      ) : (
        /* Full: labeled rows for md/lg */
        <div className="border-t border-earth-brown/25 pt-1 flex flex-col gap-0.5">
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-mono text-earth-brown tracking-widest">
              {hasReq ? '조건' : '기본'}
            </span>
            <span className="text-earth-brown">
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
            <span className="text-mist-blue">
              {card.rewards.length === 0 ? '—' : card.rewards.map((r) => ICON_EMOJI[r]).join(' ')}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
