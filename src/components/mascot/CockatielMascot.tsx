import cockatiel from '../../assets/mascots/peeking-cockatiel.png'
import './CockatielMascot.css'

type CockatielMascotProps = {
  className?: string
  alt?: string
}

/** Decorative by default; placement belongs to the consuming layout. */
export function CockatielMascot({ className = '', alt = '' }: CockatielMascotProps) {
  return (
    <img
      className={`cockatiel-mascot ${className}`.trim()}
      src={cockatiel}
      width={1536}
      height={1024}
      alt={alt}
      aria-hidden={alt ? undefined : true}
      draggable={false}
    />
  )
}
