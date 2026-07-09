import type { ReactNode } from 'react'

type Variant = 'default' | 'sunset' | 'gold' | 'moss' | 'night'

const VARIANT: Record<Variant, string> = {
  default: 'border-earth-brown/40 text-earth-brown bg-parch-light',
  sunset:  'border-sunset text-sunset-deep bg-sunset/10',
  gold:    'border-gold text-gold bg-gold/10',
  moss:    'border-moss-green text-moss-green bg-moss-green/10',
  night:   'border-night-indigo text-night-indigo bg-night-indigo/5',
}

const SIZES = {
  xs: 'text-[9px] px-1.5 py-0.5',
  sm: 'text-[10px] px-2 py-0.5',
  md: 'text-[11px] px-2.5 py-1',
}

/** Space Mono uppercase micro chip. */
export function Chip({
  children,
  variant = 'default',
  size = 'sm',
}: {
  children: ReactNode
  variant?: Variant
  size?: keyof typeof SIZES
}) {
  return (
    <span className={`inline-flex items-center font-mono uppercase tracking-widest rounded-sm border
                      ${VARIANT[variant]} ${SIZES[size]}`}>
      {children}
    </span>
  )
}
