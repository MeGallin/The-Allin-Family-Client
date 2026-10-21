import { useId } from 'react'
import { useAdminFilters } from '../../../features/admin/useAdminFilters'
import { Link } from 'react-router'
import { ArrowUpRight, Users, Activity, LogIn } from 'lucide-react'
import { insightsApi } from '../../../services/insights-query'
import { shoppingError } from '../../../services/shopping-query'
import { chartDate, featureNames } from '../../../features/insights/chart-config'
import { LoadingState } from '../../ui/LoadingState'
import { RefreshButton } from '../../ui/RefreshButton'
import { Icon } from '../../ui/Icon'
import { ActivityPulse } from './ActivityPulse'
import { FeatureActivity } from './FeatureActivity'
import { MemberParticipation } from './MemberParticipation'
import './AdminOverview.css'

export default function AdminOverview() {
  const { days, setFilter } = useAdminFilters()
  const id = useId()
  const query = insightsApi.useGetAdminInsightsQuery(days, {
    pollingInterval: 30_000,
    skipPollingIfUnfocused: true,
  })
  const data = query.currentData
  const leader = data?.features.find((feature) => feature.total > 0)
  const absent =
    data?.people.filter(
      (person) =>
        person.enabled && person.logins === 0 && person.total === 0 && person.activeSeconds === 0,
    ) ?? []
  const recorded = data?.daily.filter((day) => day.total !== null).length ?? 0
  const previous = data?.summary.previousActions
  const difference =
    previous !== null && previous !== undefined && data ? data.summary.actions - previous : null
  return (
    <div className="admin-overview">
      <div className="admin-overview__toolbar">
        <div>
          <h2>Participation at a glance</h2>
          <p className="note">Who’s taking part, what’s useful, and where to focus next.</p>
        </div>
        <div className="admin-overview__period">
          <label htmlFor={id}>Reporting period</label>
          <select id={id} value={days} onChange={(e) => setFilter('days', e.target.value)}>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <RefreshButton
            label="Refresh overview"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          />
        </div>
      </div>
      {query.error && (
        <p className="error" role="alert">
          {shoppingError(query.error)?.message ?? 'Unable to load the overview. Please try again.'}
        </p>
      )}
      {!data && query.isFetching ? (
        <LoadingState label="Building the family overview…" />
      ) : (
        data && (
          <>
            <div className="admin-overview__coverage">
              <span className="status-label">
                {recorded < 7 ? 'Early picture' : 'Recorded activity'}
              </span>
              <p>
                {chartDate(data.from)} – {chartDate(data.through)} · Shared history{' '}
                {data.activitySince
                  ? 'available from ' + chartDate(data.activitySince)
                  : 'has not started yet'}
                . Sign-in history{' '}
                {data.usageSince ? 'from ' + chartDate(data.usageSince) : 'not yet recorded'}.
              </p>
            </div>
            <dl className="data-summary">
              <div>
                <dt>
                  <Icon icon={Users} />
                  Shared contributors
                </dt>
                <dd>
                  {data.summary.contributors}
                  <span> / {data.people.length}</span>
                </dd>
              </div>
              <div>
                <dt>
                  <Icon icon={Activity} />
                  Shared actions
                </dt>
                <dd>{data.summary.actions}</dd>
                <p>
                  {difference === null
                    ? 'More history is needed to compare with the previous period.'
                    : `${difference > 0 ? '+' : ''}${difference} actions versus the previous ${days} days.`}
                </p>
              </div>
              <div>
                <dt>
                  <Icon icon={LogIn} />
                  Successful sign-ins
                </dt>
                <dd>{data.summary.signins}</dd>
              </div>
            </dl>
            <div className="insight-charts">
              <ActivityPulse data={data} />
              <FeatureActivity data={data} />
              <MemberParticipation data={data} />
            </div>
            <section className="insight-direction" aria-labelledby={id + '-direction'}>
              <header>
                <p className="admin-overview__eyebrow">Planning ahead</p>
                <h2 id={id + '-direction'}>Where to focus next</h2>
              </header>
              <ul>
                <li>
                  <strong>
                    {recorded < 7 ? 'Let the picture develop' : 'Watch the mix, not just the total'}
                  </strong>
                  <p>
                    {recorded < 7
                      ? 'There is less than a week of recorded shared history. Wait for regular family use before drawing conclusions about a trend.'
                      : 'A rise in votes and reactions can mean broader involvement, even when fewer new items are added.'}
                  </p>
                </li>
                <li>
                  <strong>
                    {absent.length
                      ? `${absent.length} ${absent.length === 1 ? 'member has' : 'members have'} no recorded use in this period`
                      : 'Every member has some recorded use'}
                  </strong>
                  <p>
                    {absent.length
                      ? `${absent.map((person) => person.name).join(', ')}. Check that everyone can sign in and knows where to start.`
                      : 'Use the member comparison to see whether participation is shared evenly.'}
                  </p>
                  <Link to={'/admin?view=usage&days=' + data.days}>
                    Review usage <Icon icon={ArrowUpRight} />
                  </Link>
                </li>
                <li>
                  <strong>
                    {leader
                      ? `${featureNames[leader.key]} is the busiest shared tool`
                      : 'Start with one useful shared activity'}
                  </strong>
                  <p>
                    {leader
                      ? `${leader.total} of ${data.summary.actions} shared actions (${Math.round((leader.total / data.summary.actions) * 100)}%). These are additions and changes, not time spent reading the page.`
                      : 'A family plan, shopping item or simple poll gives everyone a clear reason to participate.'}
                  </p>
                  <Link
                    to={
                      (leader
                        ? '/admin?view=activity&type=' + leader.key
                        : '/admin?view=activity') +
                      '&days=' +
                      data.days
                    }
                  >
                    Inspect the history <Icon icon={ArrowUpRight} />
                  </Link>
                </li>
              </ul>
            </section>
            <details className="insight-definitions">
              <summary>What these figures mean</summary>
              <p>
                Shared contributors are members who added, changed or responded to shared content.
                Successful sign-ins exclude refreshes and already-open sessions.
              </p>
              <p>
                Shared actions come from the complete recorded audit history for the period, not
                only the latest activity page. Added means new content; updated includes edits and
                shopping checks; votes and reactions includes changes and withdrawals; removed means
                a completed removal.
              </p>
              <p>
                Personal note content and history are excluded. A zero means no recorded action
                after history began; a gap means no history was recorded. London calendar days are
                used, and today is partial. Comparisons are withheld until the previous period has
                recorded coverage.
              </p>
            </details>
          </>
        )
      )}
    </div>
  )
}
