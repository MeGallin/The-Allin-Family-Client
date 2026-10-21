import { calendarSorts, type CalendarSort } from '../../../features/calendar/calendar-view'
import { ViewControls } from '../../ui/ViewControls'
export function CalendarControls({
  query,
  sort,
  onQuery,
  onSort,
  onReset,
  count,
  total,
}: {
  query: string
  sort: CalendarSort
  onQuery: (value: string) => void
  onSort: (value: string) => void
  onReset: () => void
  count: number
  total: number
}) {
  return (
    <ViewControls
      label="Calendar filters and sorting"
      queryLabel="Name or event"
      placeholder="e.g. Evelyn"
      hint="Search event names or who added/edited them."
      query={query}
      sort={sort}
      options={calendarSorts}
      onQuery={onQuery}
      onSort={onSort}
      onReset={onReset}
      active={!!query || sort !== 'soonest'}
      count={count}
      total={total}
      noun="event"
    />
  )
}
