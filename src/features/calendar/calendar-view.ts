import { createSearchMatcher, filterOption } from '../../lib/search'
import type { FamilyEvent } from './types'
import { eventDate } from '../../lib/dates'
export const calendarSorts = [
  ['soonest', 'Next event first'],
  ['latest', 'Latest event date'],
  ['newest', 'Newest added'],
  ['oldest', 'Oldest added'],
  ['updated', 'Recently edited'],
  ['name', 'Name A–Z'],
] as const
export type CalendarSort = (typeof calendarSorts)[number][0]
export function calendarSort(value: string | null): CalendarSort {
  return filterOption(value, calendarSorts, 'soonest')
}
export function calendarView(
  events: FamilyEvent[],
  query: string,
  sort: CalendarSort,
): FamilyEvent[] {
  const matches = createSearchMatcher(query)
  return events
    .filter((event) =>
      matches([event.title, event.createdBy.displayName, event.updatedBy.displayName]),
    )
    .sort((a, b) => {
      let result = 0
      if (sort === 'soonest' || sort === 'latest')
        result = (eventDate(a).getTime() - eventDate(b).getTime()) * (sort === 'latest' ? -1 : 1)
      if (sort === 'newest' || sort === 'oldest')
        result = (Date.parse(a.createdAt) - Date.parse(b.createdAt)) * (sort === 'newest' ? -1 : 1)
      if (sort === 'updated') result = Date.parse(b.updatedAt) - Date.parse(a.updatedAt)
      if (sort === 'name')
        result = a.title.localeCompare(b.title, 'en-GB', { sensitivity: 'base', numeric: true })
      return result || a.id.localeCompare(b.id, 'en-GB', { numeric: true })
    })
}
