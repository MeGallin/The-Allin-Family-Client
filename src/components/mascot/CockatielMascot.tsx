import type { CSSProperties } from 'react'
import cockatiel from '../../assets/mascots/peeking-cockatiel.png'
import './CockatielMascot.css'

type CockatielMascotProps = {
  className?: string
  size?: CSSProperties['width']
  alt?: string
}

/** Decorative by default; placement belongs to the consuming layout. */
export function CockatielMascot({ className = '', size, alt = '' }: CockatielMascotProps) {
  return (
    <img
      className={`cockatiel-mascot ${className}`.trim()}
      src={cockatiel}
      width={1536}
      height={1024}
      style={size === undefined ? undefined : { width: size }}
      alt={alt}
      aria-hidden={alt ? undefined : true}
      draggable={false}
    />
  )
}
