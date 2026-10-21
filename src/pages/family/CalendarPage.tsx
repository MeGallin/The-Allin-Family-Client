import { lazy, Suspense, useState } from 'react'
import { useNow } from '../../hooks/useNow'
import { CalendarDays, CalendarPlus, RefreshCw } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { useCalendar } from '../../features/calendar/useCalendar'
import type { FamilyEvent } from '../../features/calendar/types'
import { upcomingEvents, isUpcomingEvent, eventDate } from '../../lib/dates'
import { EventList } from '../../components/family/calendar/EventList'
import { CalendarActivity } from '../../components/family/calendar/CalendarActivity'
import { EmptyState } from '../../components/ui/EmptyState'
import { Icon } from '../../components/ui/Icon'
import { LoadingState } from '../../components/ui/LoadingState'
import { PageHeader } from '../../components/ui/PageHeader'
import { Panel } from '../../components/ui/Panel'
import './CalendarPage.css'
import { CalendarControls } from '../../components/family/calendar/CalendarControls'
import { calendarSort, calendarView } from '../../features/calendar/calendar-view'

const EventComposer = lazy(() => import('../../components/family/calendar/EventComposer'))
export default function CalendarPage() {
  const { events, loading, pending, error, feedback, refresh } = useCalendar()
  const [editing, setEditing] = useState<FamilyEvent | null>(null)
  const [search, setSearch] = useSearchParams()
  const now = useNow()
  const upcoming = upcomingEvents(events, now)
  const past = events
    .filter((event) => !isUpcomingEvent(event, now))
    .sort((a, b) => eventDate(b).getTime() - eventDate(a).getTime())
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const query = (search.get('q') ?? '').slice(0, 100)
  const sort = calendarSort(search.get('sort'))
  const shownUpcoming = calendarView(upcoming, query, sort)
  const shownPast = calendarView(past, query, sort === 'soonest' ? 'latest' : sort)
  function viewParam(key: string, value: string) {
    setSearch(
      (current) => {
        const next = new URLSearchParams(current)
        if (value) next.set(key, value)
        else next.delete(key)
        return next
      },
      { replace: true },
    )
  }
  function resetView() {
    setSearch(
      (current) => {
        const next = new URLSearchParams(current)
        next.delete('q')
        next.delete('sort')
        return next
      },
      { replace: true },
    )
  }
  function closeComposer() {
    setEditing(null)
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
        description="Shared plans for the whole family. See who added or changed each event."
        action={
          <Link
            className="button-link"
            to={
              '?' +
              new URLSearchParams({ ...Object.fromEntries(search), compose: 'event' }).toString()
            }
          >
            <Icon icon={CalendarPlus} />
            Make a plan
          </Link>
        }
      />
      <CalendarControls
        query={query}
        sort={sort}
        onQuery={(value) => viewParam('q', value)}
        onSort={(value) => viewParam('sort', value === 'soonest' ? '' : value)}
        onReset={resetView}
        count={shownUpcoming.length + shownPast.length}
        total={events.length}
      />
      <Panel
        title="Coming up"
        action={
          <button
            type="button"
            className="icon-button"
            aria-label="Refresh calendar"
            disabled={pending || loading}
            onClick={refresh}
          >
            <Icon icon={RefreshCw} />
          </button>
        }
      >
        <p className="note">Times shown in {zone}. Updates refresh automatically.</p>
        {error && (
          <p className="error" role="alert">
            {error}{' '}
            <button type="button" className="button-link" disabled={pending} onClick={refresh}>
              Try again
            </button>
          </p>
        )}
        {loading ? (
          <LoadingState label="Loading the family calendar…" />
        ) : shownUpcoming.length ? (
          <EventList events={shownUpcoming} onEdit={setEditing} disabled={pending} blocks />
        ) : (
          !error && (
            <EmptyState
              icon={CalendarDays}
              title={query ? 'No matching upcoming events' : 'The diary is clear'}
            >
              <p>
                {query
                  ? 'Try another name or reset your view.'
                  : 'Make a plan and give everyone something to look forward to.'}
              </p>
              {query && (
                <button type="button" className="button-link" onClick={resetView}>
                  Reset view
                </button>
              )}
            </EmptyState>
          )
        )}
        <p className="calendar-page__feedback" role="status">
          {feedback}
        </p>
      </Panel>
      {shownPast.length > 0 && (
        <Panel title="Earlier plans">
          <EventList events={shownPast} onEdit={setEditing} disabled={pending} blocks />
        </Panel>
      )}
      <Panel title="Calendar history">
        <CalendarActivity />
      </Panel>
      {(search.get('compose') === 'event' || editing) && (
        <Suspense fallback={<LoadingState label="Opening the event form…" />}>
          <EventComposer
            key={editing?.id ?? 'new'}
            event={editing ?? undefined}
            onClose={closeComposer}
          />
        </Suspense>
      )}
    </div>
  )
}
