import { homePolls } from './home-view'
import { memoriesApi } from '../../services/memories-query'
import { pollsApi } from '../../services/polls-query'
import { shoppingApi } from '../../services/shopping-query'
import { widgetsApi } from '../../services/widgets-query'
import { jobsApi } from '../../services/household-jobs-query'
import { useAppSelector } from '../../app/store-hooks'
import { useOnline } from '../../hooks/useOnline'
import { useRemovals } from '../removals/useRemovals'
import { diaryDays, familyMeals, mealLink } from '../widgets/meal-diary'
import { mealToday } from '../widgets/meal-calendar'
import { useNow } from '../../hooks/useNow'
import { builtinWidgetPath } from '../widgets/builtin-widgets'

export type HomeOverviewEntry = {
  kind: 'plans' | 'polls' | 'shopping' | 'meals' | 'jobs' | 'memories'
  to: string
  label: string
  count: number | null
  detail?: string
  status?: string
  live?: boolean
  deadline?: string
}
export type CalendarOverview = {
  dayCount: number
  visiblePlans: number
  upcomingPlans: number
  loading: boolean
  error: boolean
}
function summaryStatus(hasData: boolean, error: boolean, online: boolean) {
  if (!online) return hasData ? 'Offline · saved summary' : 'Offline'
  if (error) return hasData ? 'Refresh unavailable' : 'Unavailable'
  return hasData ? undefined : 'Loading…'
}

/** Projects the same subscribed caches as Home's cards; adds no request or server state. */
export function useHomeOverview(calendar: CalendarOverview): HomeOverviewEntry[] {
  const ownerId = useAppSelector((state) => state.auth.user?.id)
  const memories = memoriesApi.endpoints.getMemories.useQueryState(undefined)
  const shopping = shoppingApi.endpoints.getShopping.useQueryState(undefined)
  const polls = pollsApi.endpoints.getPolls.useQueryState(undefined)
  const widgets = widgetsApi.endpoints.getWidgets.useQueryState(ownerId ?? 0)
  const jobs = jobsApi.endpoints.getJobs.useQueryState(ownerId ?? 0)
  const { removals } = useRemovals('widgets')
  const now = useNow()
  const online = useOnline()
  const today = mealToday(now)
  const livePolls = homePolls(polls.data?.polls ?? [], now)
  const needed = shopping.data?.items.filter((item) => !item.checked) ?? []
  const important = needed.filter((item) => item.important).length
  const widgetData = widgets.currentData?.ownerId === ownerId ? widgets.currentData : undefined
  const jobData = jobs.currentData?.ownerId === ownerId ? jobs.currentData : undefined
  const sharedWidgets = (widgetData?.widgets ?? []).filter(
    (widget) => widget.visibility === 'family' && !widget.hidden && !removals[widget.id],
  )
  const sharedMeals = familyMeals(sharedWidgets)
  const diary = diaryDays(sharedMeals, now).flatMap((day) => day.meals)
  const eaten = diary.filter((entry) => entry.publication.eatenAt).length
  const upcomingMeals = sharedMeals.filter((entry) => entry.publication.forDate >= today)
  // Unqualified family routes default to Shopping; keep every fallback on a meal source.
  const sourceMeal = upcomingMeals[0] ?? diary[0]
  const mealDestination = sourceMeal
    ? mealLink(sourceMeal)
    : sharedWidgets[0]
      ? '/my-space?view=family&widget=' + encodeURIComponent(sharedWidgets[0].id)
      : '/my-space?view=library'
  const openJobs = (jobData?.jobs ?? []).filter((job) => job.scope === 'family' && !job.done)
  const calendarReady = !calendar.loading && !calendar.error
  return [
    {
      kind: 'plans',
      to: '/calendar',
      label: `Plans · next ${calendar.dayCount} days`,
      count: calendarReady ? calendar.visiblePlans : null,
      detail: calendarReady ? `${calendar.upcomingPlans} upcoming in calendar` : undefined,
      status: summaryStatus(calendarReady, calendar.error, online),
    },
    {
      kind: 'polls',
      to: builtinWidgetPath('polls'),
      label: livePolls.open.length
        ? livePolls.open.length === 1
          ? 'Live poll'
          : 'Live polls'
        : 'Open polls',
      count: polls.data ? livePolls.open.length : null,
      detail: polls.data
        ? livePolls.awaitingVote
          ? `${livePolls.awaitingVote} awaiting your vote`
          : 'You’re caught up'
        : undefined,
      live: !!livePolls.open.length && !polls.error && online,
      deadline: !polls.error && online ? livePolls.nextClosing?.closesAt : undefined,
      status: summaryStatus(!!polls.data, !!polls.error, online),
    },
    {
      kind: 'shopping',
      to: builtinWidgetPath('shopping', 'show=needed'),
      label: 'To pick up',
      count: shopping.data ? needed.length : null,
      detail: shopping.data
        ? important
          ? `${important} important`
          : needed.length
            ? 'Ready for the next shop'
            : 'All caught up'
        : undefined,
      status: summaryStatus(!!shopping.data, !!shopping.error, online),
    },
    {
      kind: 'meals',
      to: mealDestination,
      label: 'Published meals · last 7 days',
      count: widgetData ? diary.length : null,
      detail: widgetData ? `${eaten} eaten · ${upcomingMeals.length} upcoming` : undefined,
      status: summaryStatus(!!widgetData, !!widgets.error, online),
    },
    {
      kind: 'jobs',
      to: builtinWidgetPath('jobs'),
      label: 'Open family jobs',
      count: jobData ? openJobs.length : null,
      detail: jobData
        ? `${openJobs.filter((job) => job.targetDate === today).length} planned today`
        : undefined,
      status: summaryStatus(!!jobData, !!jobs.error, online),
    },
    {
      kind: 'memories',
      to: '/memories',
      label: 'Family memories',
      count: memories.data?.memories.length ?? null,
      detail: memories.data
        ? `${memories.data.memories.filter((memory) => memory.photoKey).length} with photos`
        : undefined,
      status: summaryStatus(!!memories.data, !!memories.error, online),
    },
  ]
}
