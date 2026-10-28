import { PollTimeRemaining } from './polls/PollTimeRemaining'
import { Link } from 'react-router'
import { CalendarDays, Images } from 'lucide-react'
import type { HomeOverviewEntry } from '../../features/family/useHomeOverview'
import { Icon } from '../ui/Icon'
import { WidgetGlyph } from '../widgets/WidgetGlyph'
import './HomeOverview.css'
/** Reusable summary presentation; callers supply data and source destinations. */
export function HomeOverview({ entries }: { entries: HomeOverviewEntry[] }) {
  return (
    <nav className="home-overview" aria-label="Family at a glance">
      <p className="home-overview__heading">Family at a glance</p>
      <ul className="home-overview__list">
        {entries.map((entry) => (
          <li key={entry.kind}>
            <Link
              to={entry.to}
              className="home-overview__item"
              aria-busy={entry.status === 'Loading…'}
            >
              <span className="home-overview__glyph">
                {entry.kind === 'plans' || entry.kind === 'memories' ? (
                  <Icon icon={entry.kind === 'plans' ? CalendarDays : Images} />
                ) : (
                  <WidgetGlyph id={entry.kind === 'meals' ? 'dinner' : entry.kind} />
                )}
              </span>
              <span className="home-overview__copy">
                <span className="home-overview__headline">
                  <strong className="home-overview__value">{entry.count ?? '—'}</strong>
                  <span className="home-overview__label">{entry.label}</span>
                  {entry.live && <span className="home-overview__live" aria-hidden="true" />}
                </span>
                {entry.detail && <span className="home-overview__detail">{entry.detail}</span>}
                {entry.deadline && (
                  <span className="home-overview__detail">
                    Next closes: <PollTimeRemaining value={entry.deadline} />
                  </span>
                )}
                {entry.status && <span className="home-overview__status">{entry.status}</span>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
