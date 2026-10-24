import { homePolls } from './home-view'
import { calendarApi } from '../../services/calendar-query'
import { memoriesApi } from '../../services/memories-query'
import { pollsApi } from '../../services/polls-query'
import { shoppingApi } from '../../services/shopping-query'
import { upcomingEvents } from '../../lib/dates'
import { useNow } from '../../hooks/useNow'
import { builtinWidgetPath } from '../widgets/builtin-widgets'

export function useHomeOverview() {
  // Read the same subscribed caches as the family pages; no duplicate home endpoint/store.
  const calendar = calendarApi.endpoints.getCalendar.useQueryState(undefined)
  const memories = memoriesApi.endpoints.getMemories.useQueryState(undefined)
  const shopping = shoppingApi.endpoints.getShopping.useQueryState(undefined)
  const polls = pollsApi.endpoints.getPolls.useQueryState(undefined)
  const now = useNow()
  const livePolls = homePolls(polls.data?.polls ?? [], now)
  return [
    {
      kind: 'shopping' as const,
      to: builtinWidgetPath('shopping', 'show=needed'),
      label: 'Still to pick up',
      count: shopping.data ? shopping.data.items.filter((item) => !item.checked).length : null,
      error: !!shopping.error,
    },
    {
      kind: 'plans' as const,
      to: '/calendar',
      label: 'Upcoming plans',
      count: calendar.data ? upcomingEvents(calendar.data.events, now).length : null,
      error: !!calendar.error,
    },
    {
      kind: 'polls' as const,
      to: builtinWidgetPath('polls'),
      label: livePolls.open.length
        ? livePolls.open.length === 1
          ? 'Live poll'
          : 'Live polls'
        : 'Open polls',
      count: polls.data ? livePolls.open.length : null,
      live: !!livePolls.open.length && !polls.error,
      deadline: !polls.error ? livePolls.nextClosing?.closesAt : undefined,
      error: !!polls.error,
    },
    {
      kind: 'memories' as const,
      to: '/memories',
      label: 'Family memories',
      count: memories.data?.memories.length ?? null,
      error: !!memories.error,
    },
  ]
}
