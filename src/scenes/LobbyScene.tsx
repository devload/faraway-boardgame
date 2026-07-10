import { useUI } from '../store/uiStore.ts'
import { useMatch } from '../store/matchStore.ts'
import { SunsetCTA } from '../ui/SunsetCTA.tsx'
import { Chip } from '../ui/Chip.tsx'

export function LobbyScene() {
  const setScene = useUI((s) => s.setScene)
  const start = useMatch((s) => s.start)

  return (
    <div className="w-full h-full flex flex-col pt-safe pb-safe px-6 pb-6">
      {/* Ambient wash */}
      <div className="pointer-events-none absolute inset-0"
           style={{ background: 'radial-gradient(ellipse at 30% 20%, rgba(196,139,110,0.12), transparent 55%)' }} />

      {/* Header chip */}
      <div className="relative flex justify-between items-center pt-4">
        <Chip variant="sunset" size="xs">LOBBY</Chip>
        <div className="flex items-center gap-1.5 font-mono text-[9px] tracking-[0.25em] text-earth-brown uppercase">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-sunset animate-pulse" />
          FANTASY · SOLO
        </div>
      </div>

      {/* Hero */}
      <div className="relative flex-1 flex flex-col items-center justify-center gap-4">
        <div className="font-mono text-[10px] tracking-[0.35em] text-earth-brown uppercase">
          // A JOURNEY IN 8 CARDS
        </div>
        <h1 className="font-display font-bold text-7xl leading-none tracking-widest text-night-indigo text-center"
            style={{ textShadow: '0 2px 12px rgba(196,139,110,0.3)' }}>
          FARAWAY
        </h1>
        {/* Ornament flourish under the title */}
        <div className="flex items-center gap-2 opacity-70">
          <span className="w-8 h-px bg-sunset-deep" />
          <span className="font-display text-sunset-deep text-sm">✦</span>
          <span className="w-8 h-px bg-sunset-deep" />
        </div>
        <div className="font-serif italic text-lg text-mist-blue text-center leading-relaxed max-w-xs mt-2">
          카드는 왼쪽에서 오른쪽으로,<br/>
          점수는 오른쪽에서 왼쪽으로.
        </div>

        {/* Floating tiny card previews for atmosphere */}
        <div className="mt-4 flex items-center justify-center gap-2 opacity-70">
          <TinyCardPreview illustration="mountain" tilt={-8} />
          <TinyCardPreview illustration="water" tilt={3} elevated />
          <TinyCardPreview illustration="ruin" tilt={9} />
        </div>
      </div>

      {/* Silhouette landscape strip above the CTA */}
      <div className="relative -mb-1 pointer-events-none">
        <svg viewBox="0 0 400 60" preserveAspectRatio="none" className="w-full h-10 opacity-45"
             xmlns="http://www.w3.org/2000/svg">
          <path d="M0,60 L0,42 L60,28 L110,38 L160,22 L220,34 L280,18 L340,30 L400,26 L400,60 Z"
                fill="#8b6f47" />
          <path d="M0,60 L0,52 L80,44 L140,50 L200,42 L260,48 L320,40 L400,46 L400,60 Z"
                fill="#5b4636" opacity="0.7" />
        </svg>
      </div>

      {/* CTAs */}
      <div className="relative flex flex-col gap-3">
        <SunsetCTA fullWidth size="lg"
                   onClick={() => {
                     start()
                     setScene('match')
                   }}>
          ✦ 새 여정 시작
        </SunsetCTA>
        <a href="https://github.com/devload/faraway-boardgame/blob/main/docs/GAMEPLAN.md"
           target="_blank" rel="noreferrer"
           className="text-center font-mono text-[10px] tracking-[0.25em] text-earth-brown uppercase hover:text-sunset-deep">
          📖 규칙 자세히 보기
        </a>
      </div>

      {/* Footer */}
      <div className="relative pt-4 flex justify-center">
        <div className="font-mono text-[9px] tracking-[0.3em] text-earth-brown/60 uppercase">
          Faraway · Lebrat & Goupy · 2023
        </div>
      </div>
    </div>
  )
}

/** Tiny decorative card thumb used on the lobby for atmosphere. */
function TinyCardPreview({
  illustration, tilt = 0, elevated = false,
}: {
  illustration: 'mountain' | 'water' | 'ruin' | 'forest' | 'flower'
  tilt?: number
  elevated?: boolean
}) {
  const bg: Record<typeof illustration, string> = {
    mountain: 'linear-gradient(155deg, #7c6ba8 0%, #c48b6e 60%, #d4a574 100%)',
    water:    'linear-gradient(155deg, #4a7ba8 0%, #6ba3c8 50%, #d4a574 100%)',
    forest:   'linear-gradient(155deg, #3a5b48 0%, #88a065 60%, #a5bd80 100%)',
    flower:   'linear-gradient(155deg, #c48b95 0%, #d9a68a 55%, #ffd7a8 100%)',
    ruin:     'linear-gradient(155deg, #4a5c6a 0%, #8b6f47 60%, #b8946b 100%)',
  }
  const icon: Record<typeof illustration, string> = {
    mountain: '🏔', water: '🌊', forest: '🌲', flower: '🌸', ruin: '🏛',
  }
  return (
    <div
      className={`w-14 h-20 rounded-md border border-earth-brown/60 shadow-parchment
                  flex items-center justify-center transition-transform ${elevated ? '-translate-y-2' : ''}`}
      style={{
        transform: `rotate(${tilt}deg) ${elevated ? 'translateY(-8px)' : ''}`,
        background: bg[illustration],
      }}
    >
      <span className="emoji text-lg" style={{ filter: 'drop-shadow(0 1px 2px rgba(45,36,56,0.3))' }}>
        {icon[illustration]}
      </span>
    </div>
  )
}
