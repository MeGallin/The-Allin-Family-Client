import { calendarApi } from '../../services/calendar-query'
import { memoriesApi } from '../../services/memories-query'
import { pollsApi } from '../../services/polls-query'
import { shoppingApi } from '../../services/shopping-query'
import { upcomingEvents } from '../../lib/dates'
import { useNow } from '../../hooks/useNow'

export function useHomeOverview() {
  // Read the same subscribed caches as the family pages; no duplicate home endpoint/store.
  const calendar = calendarApi.endpoints.getCalendar.useQueryState(undefined)
  const memories = memoriesApi.endpoints.getMemories.useQueryState(undefined)
  const shopping = shoppingApi.endpoints.getShopping.useQueryState(undefined)
  const polls = pollsApi.endpoints.getPolls.useQueryState(undefined)
  const now = useNow()
  return [
    {
      to: '/calendar',
      label: 'Upcoming plans',
      count: calendar.data ? upcomingEvents(calendar.data.events, now).length : null,
      error: !!calendar.error,
    },
    {
      to: '/memories',
      label: 'Family memories',
      count: memories.data?.memories.length ?? null,
      error: !!memories.error,
    },
    {
      to: '/lists?show=needed',
      label: 'Still to pick up',
      count: shopping.data ? shopping.data.items.filter((item) => !item.checked).length : null,
      error: !!shopping.error,
    },
    {
      to: '/polls',
      label: 'Open polls',
      count: polls.data ? polls.data.polls.filter((poll) => !poll.closed).length : null,
      error: !!polls.error,
    },
  ]
}
