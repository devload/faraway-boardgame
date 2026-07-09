/**
 * Faraway — solo mobile fan remake.
 *
 * MVP roadmap:
 *   Week 1 — cards / hand / tableau / market / 8-round loop / bots / ascending
 *   Week 2 — reverse scoring + score ceremony scene + Lobby/Result polish
 */
export default function App() {
  return (
    <div className="w-full h-full flex flex-col pt-safe pb-safe overflow-hidden">
      {/* Ambient dawn wash */}
      <div className="pointer-events-none absolute inset-0"
           style={{
             background: 'radial-gradient(ellipse at 30% 20%, rgba(196,139,110,0.12), transparent 55%)',
           }} />

      {/* Hero */}
      <div className="relative flex-1 flex flex-col items-center justify-center gap-6 px-8">
        <div className="text-[10px] tracking-[0.4em] text-earth-brown uppercase font-mono">
          // Working Title
        </div>
        <h1 className="font-display text-6xl leading-none tracking-widest text-night-indigo"
            style={{ textShadow: '0 2px 8px rgba(196,139,110,0.25)' }}>
          FARAWAY
        </h1>
        <div className="font-serif italic text-lg text-mist-blue text-center leading-relaxed max-w-xs">
          카드는 왼쪽에서 오른쪽으로,<br/>
          점수는 오른쪽에서 왼쪽으로.
        </div>
        <div className="mt-4 flex flex-col items-center gap-2">
          <div className="font-mono text-[10px] tracking-widest text-earth-brown/70 uppercase">
            Solo Mobile Remake
          </div>
          <div className="font-mono text-[9px] tracking-[0.3em] text-earth-brown/50 uppercase">
            Corentin Lebrat · Johannes Goupy · 2023
          </div>
        </div>
      </div>

      {/* Footer status chip */}
      <div className="relative pb-6 flex justify-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                        bg-parch-light border border-earth-brown/20 shadow-card-lift">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-sunset animate-pulse" />
          <span className="font-mono text-[10px] tracking-[0.25em] text-earth-brown uppercase">
            v0.0 · scaffold
          </span>
        </div>
      </div>
    </div>
  )
}
