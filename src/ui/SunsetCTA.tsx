import type { ReactNode } from 'react'

/**
 * Sunset CTA — Faraway's equivalent of the neon HoloCTA. Warm gradient
 * background, Cormorant italic label, sweep-shine every 2s.
 */
export function SunsetCTA({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  fullWidth = false,
  size = 'md',
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: 'primary' | 'ghost'
  fullWidth?: boolean
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }
  const styles = {
    primary: 'text-parch-cream bg-gradient-to-br from-sunset via-sunset-deep to-earth-brown shadow-parchment',
    ghost:   'text-earth-brown border-2 border-earth-brown/60 bg-parch-light hover:bg-parch-warm',
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative overflow-hidden rounded-full font-serif italic font-semibold tracking-wide
                  transition-all
                  ${sizes[size]} ${styles[variant]}
                  ${fullWidth ? 'w-full' : ''}
                  ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:-translate-y-0.5'}`}
    >
      <span className="relative z-10">{children}</span>
      {!disabled && variant === 'primary' && (
        <span aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.35) 48%, transparent 62%)',
                animation: 'sunset-sweep 2.4s ease-in-out infinite',
              }} />
      )}
      <style>{`
        @keyframes sunset-sweep {
          0%   { transform: translateX(-140%); }
          60%  { transform: translateX(140%); }
          100% { transform: translateX(140%); }
        }
      `}</style>
    </button>
  )
}
