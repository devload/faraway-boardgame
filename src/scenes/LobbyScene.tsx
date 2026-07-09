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
        <div className="font-serif italic text-lg text-mist-blue text-center leading-relaxed max-w-xs mt-2">
          카드는 왼쪽에서 오른쪽으로,<br/>
          점수는 오른쪽에서 왼쪽으로.
        </div>
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
