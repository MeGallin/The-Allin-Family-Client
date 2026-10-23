import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Icon } from '../ui/Icon'
import './ProfileSection.css'

export function ProfileSection({
  icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <div className="profile-section">
      <header className="profile-section__heading">
        <span className="profile-section__icon">
          <Icon icon={icon} />
        </span>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </header>
      <div className="profile-section__body">{children}</div>
    </div>
  )
}
