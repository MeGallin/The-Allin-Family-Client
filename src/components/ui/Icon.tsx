import type { LucideIcon } from 'lucide-react'
import './Icon.css'

export function Icon({ icon: Glyph, className = '' }: { icon: LucideIcon; className?: string }) {
  return (
    <Glyph
      className={'ui-icon ' + className}
      strokeWidth={1.75}
      aria-hidden="true"
      focusable="false"
    />
  )
}
