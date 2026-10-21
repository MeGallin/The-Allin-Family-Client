import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Icon } from './Icon'
import './EmptyState.css'

type EmptyStateProps = { icon: LucideIcon; title: string; children: ReactNode }

export function EmptyState({ icon, title, children }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <Icon icon={icon} />
      <h2>{title}</h2>
      <div>{children}</div>
    </div>
  )
}
