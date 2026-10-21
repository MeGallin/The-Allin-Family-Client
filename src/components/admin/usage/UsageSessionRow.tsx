import type { UsageSession } from '../../../features/usage/types'
import { usageDuration, usagePages, usageStatus } from '../../../features/usage/usage-format'
import { FriendlyTime } from '../../ui/FriendlyTime'

export function UsageSessionRow({ session }: { session: UsageSession }) {
  return (
    <li className="admin-usage__session">
      <div className="admin-usage__session-heading">
        <strong>{session.name}</strong>
        <span className="status-label">{usageStatus[session.status]}</span>
      </div>
      <p className="note">
        {session.loginAt ? 'Signed in ' : 'Existing session first observed '}
        <FriendlyTime value={session.loginAt ?? session.startedAt} showExact />
      </p>
      <p>
        {usageDuration(session.activeSeconds)} active ·{' '}
        {session.status === 'logout' ? 'Signed out from ' : 'Last seen in '}
        <strong>{usagePages[session.lastPage] ?? 'Family space'}</strong>
      </p>
      <details>
        <summary>Session details</summary>
        <dl>
          <div>
            <dt>Last activity signal</dt>
            <dd>
              <FriendlyTime value={session.lastSeenAt} showExact />
            </dd>
          </div>
          {session.endedAt && (
            <div>
              <dt>
                {session.status === 'logout' ? 'Signed out' : 'Last observed before session ended'}
              </dt>
              <dd>
                <FriendlyTime value={session.endedAt} showExact />
              </dd>
            </div>
          )}
          {!session.loginAt && (
            <div>
              <dt>Login count</dt>
              <dd>
                This session was already open when tracking began, so it does not count as a new
                login.
              </dd>
            </div>
          )}
          {session.status === 'inactive' && (
            <div>
              <dt>Last page</dt>
              <dd>
                This is the last recorded section, not a confirmed logout location. Closing a tab or
                browser cannot reliably be detected.
              </dd>
            </div>
          )}
        </dl>
      </details>
    </li>
  )
}
