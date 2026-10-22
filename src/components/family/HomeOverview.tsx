import { Link } from 'react-router'
import { CalendarDays, Images, ShoppingBasket, Vote } from 'lucide-react'
import { useHomeOverview } from '../../features/family/useHomeOverview'
import { Icon } from '../ui/Icon'
import './HomeOverview.css'
const icons = { plans: CalendarDays, memories: Images, shopping: ShoppingBasket, polls: Vote }
export function HomeOverview() {
  const entries = useHomeOverview()
  return (
    <nav className="home-overview" aria-label="Family at a glance">
      {entries.map((entry) => (
        <Link to={entry.to} className="home-overview__item" key={entry.to}>
          <Icon icon={icons[entry.kind]} />
          <span className="home-overview__value">{entry.count ?? '—'}</span>
          <span className="home-overview__label">{entry.label}</span>
          {(entry.error || entry.count === null) && (
            <span className="home-overview__status">
              {entry.error
                ? entry.count === null
                  ? 'Unavailable'
                  : 'Refresh unavailable'
                : 'Loading…'}
            </span>
          )}
        </Link>
      ))}
    </nav>
  )
}
