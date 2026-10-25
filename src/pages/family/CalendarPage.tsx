import { useCollectionFilters } from '../../hooks/useCollectionFilters'
import { useCollectionWindow } from '../../hooks/useCollectionWindow'
import { CollectionMore } from '../../components/ui/CollectionMore'
import { lazy, Suspense, useState } from 'react'
import { useNow } from '../../hooks/useNow'
import { CalendarDays, CalendarPlus } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { useCalendar } from '../../features/calendar/useCalendar'
import type { FamilyEvent } from '../../features/calendar/types'
import { validDateInput, dateInputValue, eventDate } from '../../lib/dates'
import { calendarGroups, selectedCalendarEvent } from '../../features/calendar/calendar-selection'
import { EventList } from '../../components/family/calendar/EventList'
import { CalendarEventSelection } from '../../components/family/calendar/CalendarEventSelection'
import { CalendarActivity } from '../../components/family/calendar/CalendarActivity'
import { EmptyState } from '../../components/ui/EmptyState'
import { Icon } from '../../components/ui/Icon'
import { LoadingState } from '../../components/ui/LoadingState'
import { PageHeader } from '../../components/ui/PageHeader'
import { Panel } from '../../components/ui/Panel'
import { RefreshButton } from '../../components/ui/RefreshButton'
import { CalendarControls } from '../../components/family/calendar/CalendarControls'
import { calendarSort, calendarView } from '../../features/calendar/calendar-view'
import './CalendarPage.css'

const EventComposer = lazy(() => import('../../components/family/calendar/EventComposer'))
export default function CalendarPage() {
  const { events, loading, pending, error, feedback, refresh, removals } = useCalendar()
  const [editing, setEditing] = useState<FamilyEvent | null>(null)
  const [search, setSearch] = useSearchParams()
  const initialDay = validDateInput(search.get('date'))
  const groups = calendarGroups(events, useNow())
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const { query, sort, setQuery, setSort, reset } = useCollectionFilters({ sort: calendarSort })
  const shownToday = calendarView(groups.today, query, sort)
  const shownFuture = calendarView(groups.future, query, sort)
  const shownPast = calendarView(groups.past, query, sort === 'soonest' ? 'latest' : sort)
  const selectedId = search.get('event')
  const selected = selectedCalendarEvent(events, selectedId, search.get('occurrence'))
  const selectedDay = selected.event ? dateInputValue(eventDate(selected.event)) : null
  const selectedInResults = [...shownToday, ...shownFuture, ...shownPast].some(
    (event) => event.id === selectedId && dateInputValue(eventDate(event)) === selectedDay,
  )
  const todayWindow = useCollectionWindow(shownToday, {
    viewKey: query + ':' + sort,
    targetId: selectedId,
  })
  const futureWindow = useCollectionWindow(shownFuture, {
    viewKey: query + ':' + sort,
    targetId: selectedId,
  })
  const pastWindow = useCollectionWindow(shownPast, {
    viewKey: query + ':' + sort,
    targetId: selectedId,
  })
  const count = shownToday.length + shownFuture.length + shownPast.length
  function closeSelection() {
    setSearch(
      (current) => {
        const next = new URLSearchParams(current)
        next.delete('event')
        next.delete('occurrence')
        return next
      },
      { replace: true, preventScrollReset: true },
    )
  }
  function closeComposer() {
    setEditing(null)
    setSearch(
      (current) => {
        const next = new URLSearchParams(current)
        next.delete('compose')
        next.delete('date')
        return next
      },
      { replace: true },
    )
  }
  return (
    <div className="page-stack page-enter calendar-page">
      <PageHeader
        title="Time together"
        description="Birthdays, plans and reasons to get together."
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
      <div className="content-layout">
        <div className="content-layout__main">
          <CalendarControls
            query={query}
            sort={sort}
            onQuery={setQuery}
            onSort={setSort}
            onReset={reset}
            count={count}
            total={events.length}
          />
          <div className="calendar-page__status">
            <p className="note">Times shown in {zone}. Updates refresh automatically.</p>
            <RefreshButton
              label="Refresh calendar"
              disabled={pending || loading}
              onClick={refresh}
            />
          </div>
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
          ) : (
            <>
              {[
                { title: 'Today', window: todayWindow, label: 'today’s plans' },
                { title: 'Coming up', window: futureWindow, label: 'upcoming plans' },
                { title: 'Earlier plans', window: pastWindow, label: 'earlier plans' },
              ]
                .filter((group) => group.window.total > 0)
                .map((group) => (
                  <Panel key={group.title} title={group.title}>
                    <EventList
                      events={group.window.items}
                      onEdit={setEditing}
                      disabled={pending}
                      blocks
                      selectedId={selectedId}
                      selectedOccurrence={
                        selected.event ? dateInputValue(eventDate(selected.event)) : null
                      }
                    />
                    <CollectionMore {...group.window} label={group.label} />
                  </Panel>
                ))}
              {!error && count === 0 && (
                <Panel title="Your calendar">
                  <EmptyState
                    icon={CalendarDays}
                    title={query ? 'No matching events' : 'The diary is clear'}
                  >
                    <p>
                      {query
                        ? 'Try another name or clear the search.'
                        : 'Make a plan and give everyone something to look forward to.'}
                    </p>
                    {query && (
                      <button type="button" className="button-link" onClick={() => setQuery('')}>
                        Clear search
                      </button>
                    )}
                  </EmptyState>
                </Panel>
              )}
            </>
          )}
          <p className="calendar-page__feedback" role="status">
            {feedback}
          </p>
        </div>
        <aside className="content-layout__aside" aria-label="Calendar history">
          <Panel title="Calendar history">
            <CalendarActivity />
          </Panel>
        </aside>
      </div>
      {search.has('event') && !loading && !editing && search.get('compose') !== 'event' && (
        <CalendarEventSelection
          event={error ? null : selected.event}
          reason={selected.reason}
          unavailable={!!error}
          outsideResults={!!selected.event && !selectedInResults}
          editDisabled={pending || !!(selected.event && removals[selected.event.id])}
          removal={selected.event ? removals[selected.event.id] : undefined}
          onClose={closeSelection}
          onCalendar={() => setSearch({}, { replace: true })}
          onEdit={(event) => {
            if (pending || removals[event.id]) return
            closeSelection()
            setEditing(events.find((saved) => saved.id === event.id) ?? event)
          }}
        />
      )}
      {(search.get('compose') === 'event' || editing) && (
        <Suspense fallback={<LoadingState label="Opening the event form…" />}>
          <EventComposer
            key={editing?.id ?? 'new-' + (initialDay ?? '')}
            event={editing ?? undefined}
            initialDay={initialDay}
            onClose={closeComposer}
          />
        </Suspense>
      )}
    </div>
  )
}
