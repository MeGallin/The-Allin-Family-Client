import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'
import { useAppSelector } from '../../../app/store-hooks'
import { jobsApi } from '../../../services/household-jobs-query'
import { shoppingError } from '../../../services/shopping-query'
import { useLiveQueryOptions } from '../../../hooks/useLiveQueryOptions'
import { useOnline } from '../../../hooks/useOnline'
import { useNow } from '../../../hooks/useNow'
import { mealToday, shiftMealDay, formatMealDate } from '../../../features/widgets/meal-calendar'
import { builtinWidgetPath } from '../../../features/widgets/builtin-widgets'
import { Icon } from '../../ui/Icon'
import { WidgetAppIcon } from '../../widgets/WidgetStoreArt'
import { HomeDataError } from './HomeDataError'

/** Home projects shared jobs only; private jobs and all mutations stay at their source. */
export function HomeJobsSummary() {
  const owner = useAppSelector((s) => s.auth.user?.id)
  const busy = useAppSelector((s) => s.jobsUi.busy)
  const live = useLiveQueryOptions('/household-jobs', busy)
  const online = useOnline()
  const query = jobsApi.useGetJobsQuery(owner ?? 0, { ...live, skip: !owner || live.skip })
  const now = useNow()
  const snapshot = query.currentData?.ownerId === owner ? query.currentData : undefined
  const loading = online && !snapshot && !query.isError
  const error = !online
    ? 'You’re offline. Reconnect to refresh family jobs.'
    : query.isError
      ? (shoppingError(query.error)?.message ?? 'Family jobs could not be refreshed.')
      : ''
  // Filter both collections before deriving any counts, titles or dates.
  const shared = (snapshot?.jobs ?? []).filter((j) => j.scope === 'family')
  const all = [...shared, ...(snapshot?.archive ?? []).filter((j) => j.scope === 'family')]
  const open = shared.filter((j) => !j.done)
  const today = mealToday(now)
  const monday = shiftMealDay(today, -((new Date(today + 'T12:00:00Z').getUTCDay() + 6) % 7))
  const completed = all.reduce((total, job) => {
    const retained: typeof job.history = []
    for (const event of [...job.history].reverse()) {
      if (event.action === 'complete') retained.push(event)
      else if (event.action === 'reopen') retained.pop()
    }
    return (
      total +
      retained.filter(
        (event) =>
          Date.parse(event.occurredAt) <= now && mealToday(new Date(event.occurredAt)) >= monday,
      ).length
    )
  }, 0)
  const next = open
    .filter((j) => j.targetDate && j.targetDate >= today)
    .sort((a, b) => a.targetDate!.localeCompare(b.targetDate!))[0]
  return (
    <section aria-label="Household jobs summary" className="home-index-item" aria-busy={loading}>
      {!online ? (
        <div className="home-data-error" role="alert">
          <p>{error}</p>
        </div>
      ) : (
        <HomeDataError
          error={error}
          retry={() => {
            if (!query.isUninitialized) void query.refetch()
          }}
        />
      )}
      <Link to={builtinWidgetPath('jobs')} className="home-index-row">
        <WidgetAppIcon id="jobs" compact />
        <span className="home-index-row__label">
          <strong>Household Jobs</strong>
          <small>Shared care for home</small>
        </span>
        <span className="home-index-row__status">
          {loading || error ? (
            <strong>{loading ? 'Loading family jobs…' : 'Jobs summary unavailable'}</strong>
          ) : (
            <>
              <strong>
                {open.length} open · {open.filter((j) => j.targetDate === today).length} planned
                today · {completed} done this week
              </strong>
              <span>
                {next
                  ? 'Next target: ' +
                    next.title +
                    ' · ' +
                    formatMealDate(next.targetDate!, { day: 'numeric', month: 'short' })
                  : open.length
                    ? 'Flexible planning · No upcoming target day'
                    : 'No open family jobs'}
              </span>
            </>
          )}
        </span>
        <span className="home-index-row__action">
          Open <Icon icon={ArrowUpRight} />
        </span>
      </Link>
    </section>
  )
}
