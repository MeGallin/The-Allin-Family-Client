import { lazy, Suspense } from 'react'
import { CalendarDays, CalendarPlus } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { useFamilyData } from '../../features/family/useFamilyData'
import { upcomingEvents } from '../../lib/dates'
import { EventList } from '../../components/family/calendar/EventList'
import { EmptyState } from '../../components/ui/EmptyState'
import { Icon } from '../../components/ui/Icon'
import { LoadingState } from '../../components/ui/LoadingState'
import { PageHeader } from '../../components/ui/PageHeader'
import { Panel } from '../../components/ui/Panel'
import './CalendarPage.css'

const EventComposer = lazy(() => import('../../components/family/calendar/EventComposer'))

export default function CalendarPage() {
  const { events } = useFamilyData()
  const [search, setSearch] = useSearchParams()
  const upcoming = upcomingEvents(events)
  const past = events
    .filter((event) => Date.parse(event.startsAt) < Date.now())
    .sort((a, b) => Date.parse(b.startsAt) - Date.parse(a.startsAt))
  function closeComposer() {
    setSearch(
      (current) => {
        const next = new URLSearchParams(current)
        next.delete('compose')
        return next
      },
      { replace: true },
    )
  }
  return (
    <div className="page-stack page-enter calendar-page">
      <PageHeader
        title="Time together"
        description="A place for family plans, catch-ups and things to look forward to."
        action={
          <Link className="button-link" to="?compose=event">
            <Icon icon={CalendarPlus} />
            Make a plan
          </Link>
        }
      />
      <Panel title="Coming up">
        {upcoming.length ? (
          <EventList events={upcoming} />
        ) : (
          <EmptyState icon={CalendarDays} title="The diary is clear">
            <p>Make a plan and give everyone something to look forward to.</p>
          </EmptyState>
        )}
      </Panel>
      {past.length > 0 && (
        <Panel title="Earlier plans">
          <EventList events={past} />
        </Panel>
      )}
      {search.get('compose') === 'event' && (
        <Suspense fallback={<LoadingState label="Opening the event form…" />}>
          <EventComposer onClose={closeComposer} />
        </Suspense>
      )}
    </div>
  )
}
