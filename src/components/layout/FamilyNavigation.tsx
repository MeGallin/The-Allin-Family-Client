import { NavLink } from 'react-router'
import { Icon } from '../ui/Icon'
import { familyNavigation } from '../../features/family/navigation'
import './FamilyNavigation.css'

export function FamilyNavigation({ mobile = false }: { mobile?: boolean }) {
  return (
    <nav
      className={mobile ? 'family-navigation family-navigation--mobile' : 'family-navigation'}
      aria-label={mobile ? 'Mobile navigation' : 'Family navigation'}
    >
      {familyNavigation.map(({ to, label, icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => 'family-navigation__link' + (isActive ? ' is-active' : '')}
        >
          <Icon icon={icon} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
