import { Link } from 'react-router'
import { CalendarPlus, Camera, MessagesSquare, ShoppingBasket } from 'lucide-react'
import { Icon } from '../ui/Icon'
import { builtinWidgetPath } from '../../features/widgets/builtin-widgets'
import './QuickActions.css'

const actions = [
  { to: '/memories?compose=memory', label: 'Share a moment', icon: Camera },
  { to: '/calendar?compose=event', label: 'Make a plan', icon: CalendarPlus },
  { to: builtinWidgetPath('shopping'), label: 'Shopping list', icon: ShoppingBasket },
  { to: builtinWidgetPath('polls'), label: 'Have a say', icon: MessagesSquare },
]

export function QuickActions() {
  return (
    <nav className="quick-actions" aria-label="Family shortcuts">
      {actions.map(({ to, label, icon }) => (
        <Link key={label} to={to}>
          <Icon icon={icon} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  )
}
