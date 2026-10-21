import { NavLink } from 'react-router'
import { Icon } from '../ui/Icon'
import { familyNavigation } from '../../features/family/navigation'
import './FamilyNavigation.css'

export function FamilyNavigation({
  mobile = false,
  familyName,
}: {
  mobile?: boolean
  familyName: string
}) {
  return (
    <nav
      className={mobile ? 'family-navigation family-navigation--mobile' : 'family-navigation'}
      aria-label={mobile ? 'Mobile navigation' : 'Family navigation'}
    >
      {familyNavigation
        .filter((entry) => !mobile || !('desktopOnly' in entry && entry.desktopOnly))
        .map(({ to, label, mobileLabel, icon, end }) => {
          const personalLabel = to === '/notes' ? `${familyName}’s Personal Notes` : label
          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              aria-label={personalLabel}
              className={({ isActive }) =>
                'family-navigation__link' + (isActive ? ' is-active' : '')
              }
            >
              <Icon icon={icon} />
              <span>{mobile ? (mobileLabel ?? personalLabel) : personalLabel}</span>
            </NavLink>
          )
        })}
    </nav>
  )
}
