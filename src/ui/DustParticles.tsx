import { useMemo } from 'react'

/**
 * Ambient dust/petal particles that drift upward across the viewport.
 * Placed as an absolutely positioned overlay in App or any scene root.
 * Purely decorative — pointer-events-none, doesn't affect layout.
 *
 * Uses deterministic random positions seeded off the index so React doesn't
 * shuffle particles between renders.
 */
export function DustParticles({ count = 14 }: { count?: number }) {
  const particles = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      // Deterministic pseudo-random using index — same particle positions every render.
      const seed = (i * 9301 + 49297) % 233280
      const rand = (n: number) => ((seed * (n + 7)) % 233280) / 233280
      const left = rand(1) * 100
      const size = 3 + rand(2) * 4
      const delay = rand(3) * 20
      const duration = 18 + rand(4) * 14
      const opacity = 0.15 + rand(5) * 0.3
      const drift = (rand(6) - 0.5) * 40
      return { i, left, size, delay, duration, opacity, drift }
    })
  }, [count])

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
      {particles.map((p) => (
        <div
          key={p.i}
          className="absolute rounded-full"
          style={{
            left: `${p.left}%`,
            bottom: '-20px',
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: 'radial-gradient(circle, rgba(212,165,116,0.9) 0%, rgba(196,139,110,0.4) 60%, transparent 100%)',
            opacity: p.opacity,
            filter: 'blur(0.5px)',
            animation: `dust-rise-${p.i} ${p.duration}s linear ${p.delay}s infinite`,
          }}
        />
      ))}
      <style>{particles.map((p) => `
        @keyframes dust-rise-${p.i} {
          0%   { transform: translate(0, 0) scale(1); opacity: 0; }
          10%  { opacity: ${p.opacity}; }
          90%  { opacity: ${p.opacity}; }
          100% { transform: translate(${p.drift}px, -110vh) scale(0.6); opacity: 0; }
        }
      `).join('\n')}</style>
    </div>
  )
}
