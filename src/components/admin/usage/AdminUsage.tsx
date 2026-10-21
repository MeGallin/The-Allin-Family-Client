import { useId, useState } from 'react'
import { usageApi } from '../../../services/usage-query'
import { shoppingError } from '../../../services/shopping-query'
import { usageDuration } from '../../../features/usage/usage-format'
import { FriendlyTime } from '../../ui/FriendlyTime'
import { LoadingState } from '../../ui/LoadingState'
import { UsageSessionRow } from './UsageSessionRow'
import './AdminUsage.css'

export default function AdminUsage() {
  const id = useId()
  const [days, setDays] = useState('30')
  const [user, setUser] = useState('')
  const [before, setBefore] = useState('')
  const query = usageApi.useGetAdminUsageQuery(
    { days, user, before },
    {
      pollingInterval: before ? 0 : 30_000,
      skipPollingIfUnfocused: true,
    },
  )
  const data = query.currentData
  const people = data?.people.filter((person) => !user || String(person.id) === user) ?? []
  const used = people.filter((person) => person.usedInPeriod).length
  const logins = people.reduce((total, person) => total + person.logins, 0)
  const seconds = people.reduce((total, person) => total + person.activeSeconds, 0)
  return (
    <section className="admin-usage" aria-labelledby={id + '-title'}>
      <header>
        <h2 id={id + '-title'}>Platform usage</h2>
        <p className="note">
          See who is using the family space, how often they sign in and where their visits end.
        </p>
      </header>
      <div className="admin-usage__filters">
        <div>
          <label htmlFor={id + '-period'}>Session period</label>
          <select
            id={id + '-period'}
            value={days}
            onChange={(e) => {
              setDays(e.target.value)
              setBefore('')
            }}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="0">Since tracking began</option>
          </select>
        </div>
        <div>
          <label htmlFor={id + '-person'}>Usage for</label>
          <select
            id={id + '-person'}
            value={user}
            onChange={(e) => {
              setUser(e.target.value)
              setBefore('')
            }}
          >
            <option value="">Everyone</option>
            {data?.people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="secondary"
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          Refresh usage
        </button>
      </div>
      <p className="note">
        Totals cover sessions started in the selected period. Last sign-in and last seen cover all
        recorded history. Tracking starts from this update.
      </p>
      <p className="note">
        Active time is an estimate from visible pages and recent interaction, checked about every 30
        seconds. Idle or hidden tabs stop adding time. No activity before tracking began can be
        reconstructed.
      </p>
      {query.error && (
        <p className="error" role="alert">
          {shoppingError(query.error)?.message ?? 'Unable to load usage.'}
        </p>
      )}
      {!data && query.isFetching ? (
        <LoadingState label="Loading platform usage…" />
      ) : (
        data && (
          <>
            <dl className="admin-usage__totals">
              <div>
                <dt>Sign-ins</dt>
                <dd>{logins}</dd>
              </div>
              <div>
                <dt>Estimated active time</dt>
                <dd>{usageDuration(seconds)}</dd>
              </div>
              <div>
                <dt>Members using the site</dt>
                <dd>
                  {used} <span>of {people.length}</span>
                </dd>
              </div>
            </dl>
            <h3>Family members</h3>
            <ul className="admin-usage__people">
              {people.map((person) => (
                <li key={person.id}>
                  <div className="admin-usage__session-heading">
                    <strong>{person.name}</strong>
                    <span className="note">
                      {!person.enabled
                        ? 'Account disabled'
                        : person.usedInPeriod
                          ? 'Used in this period'
                          : 'No recorded use in this period'}
                    </span>
                  </div>
                  <p>
                    {person.logins} {person.logins === 1 ? 'sign-in' : 'sign-ins'} ·{' '}
                    {usageDuration(person.activeSeconds)} active
                  </p>
                  <dl className="admin-usage__member-dates">
                    <div>
                      <dt>Last sign-in</dt>
                      <dd>
                        {person.lastLoginAt ? (
                          <FriendlyTime value={person.lastLoginAt} showExact />
                        ) : (
                          'No recorded sign-in'
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt>Last seen</dt>
                      <dd>
                        {person.lastSeenAt ? (
                          <FriendlyTime value={person.lastSeenAt} showExact />
                        ) : (
                          'No recorded use'
                        )}
                      </dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
            <h3>Recent sessions</h3>
            {data.sessions.length ? (
              <ol className="admin-usage__sessions">
                {data.sessions.map((session) => (
                  <UsageSessionRow session={session} key={session.id} />
                ))}
              </ol>
            ) : (
              <p className="note">No sessions match these filters.</p>
            )}
            <div className="actions">
              {before && (
                <button
                  type="button"
                  className="secondary"
                  disabled={query.isFetching}
                  onClick={() => setBefore('')}
                >
                  Latest sessions
                </button>
              )}
              {data.nextCursor && (
                <button
                  type="button"
                  className="secondary"
                  disabled={query.isFetching}
                  onClick={() => setBefore(data.nextCursor!)}
                >
                  Older sessions
                </button>
              )}
            </div>
          </>
        )
      )}
    </section>
  )
}
