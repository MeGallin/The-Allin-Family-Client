import { useId } from 'react'
import { useAdminFilters } from '../../../features/admin/useAdminFilters'
import { activityApi } from '../../../services/activity-query'
import { membersApi } from '../../../services/members-query'
import { shoppingError } from '../../../services/shopping-query'
import { LoadingState } from '../../ui/LoadingState'
import { ActivityRow } from './ActivityRow'
const activityDay = (value: string) =>
  new Intl.DateTimeFormat('en-GB', { dateStyle: 'full', timeZone: 'Europe/London' }).format(
    new Date(value),
  )
import './AdminActivity.css'
export default function AdminActivity() {
  const { params, setFilter } = useAdminFilters()
  const type = params.get('type') ?? ''
  const actor = params.get('actor') ?? ''
  const before = params.get('before') ?? ''
  const setBefore = (value: string) => setFilter('before', value)
  const id = useId()
  const query = activityApi.useGetAdminActivityQuery(
    { type, actor, before },
    { pollingInterval: before ? 0 : 15000, skipPollingIfUnfocused: true },
  )
  const users = membersApi.useGetAdminMembersQuery(undefined)
  // currentData avoids briefly showing another filter/page's rows while a request loads.
  const data = query.currentData
  return (
    <section className="admin-activity" aria-labelledby={id + '-title'}>
      <header>
        <h2 id={id + '-title'}>Family activity</h2>
        <p className="note">
          See who added, edited, removed, liked or voted on shared content. Personal notes remain
          private.
        </p>
      </header>
      <div className="admin-activity__filters">
        <div>
          <label htmlFor={id + '-type'}>Feature</label>
          <select
            id={id + '-type'}
            value={type}
            onChange={(e) => {
              setFilter('type', e.target.value)
            }}
          >
            {[
              ['', 'All shared activity'],
              ['shopping_item', 'Shopping'],
              ['calendar_event', 'Calendar'],
              ['memory', 'Memories and likes'],
              ['poll', 'Polls and votes'],
              ['user_profile', 'Nicknames'],
              ['user_account', 'Family accounts'],
            ].map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={id + '-actor'}>Changed by</label>
          <select
            id={id + '-actor'}
            value={actor}
            onChange={(e) => {
              setFilter('actor', e.target.value)
            }}
          >
            <option value="">Everyone</option>
            {users.data?.members.map((user) => (
              <option value={user.id} key={user.id}>
                {user.familyName}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="secondary"
          disabled={query.isLoading}
          onClick={() => void query.refetch()}
        >
          Refresh activity
        </button>
      </div>
      <p className="note">
        Newest changes first.{' '}
        {before ? 'Showing older activity.' : 'Updates refresh automatically.'}
      </p>
      {query.error && (
        <p className="error" role="alert">
          {shoppingError(query.error)?.message ?? 'Unable to load activity.'}
        </p>
      )}
      {!data && query.isFetching ? (
        <LoadingState label="Loading family activity…" />
      ) : data?.entries.length ? (
        <ol className="admin-activity__list">
          {data.entries.map((entry, index) => (
            <ActivityRow
              entry={entry}
              key={entry.id}
              day={
                index === 0 ||
                activityDay(entry.occurredAt) !== activityDay(data.entries[index - 1].occurredAt)
                  ? activityDay(entry.occurredAt)
                  : undefined
              }
            />
          ))}
        </ol>
      ) : (
        !query.error && <p className="note">No activity matches these filters.</p>
      )}
      <div className="actions">
        {before && (
          <button
            type="button"
            className="secondary"
            disabled={query.isFetching}
            onClick={() => setBefore('')}
          >
            Latest activity
          </button>
        )}
        {data?.nextCursor && (
          <button
            type="button"
            className="secondary"
            disabled={query.isFetching}
            onClick={() => setBefore(data.nextCursor!)}
          >
            Older activity
          </button>
        )}
      </div>
    </section>
  )
}
