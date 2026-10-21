import { useState } from 'react'
import { Link } from 'react-router'
import { useAppDispatch, useAppSelector } from '../../app/store-hooks'
import { membersApi } from '../../services/members-query'
import { shoppingError } from '../../services/shopping-query'
import { executeMemberWrite } from '../../features/members/members-actions'
import { membersUiReset } from '../../features/members/members-ui-slice'
import { useAdminFilters } from '../../features/admin/useAdminFilters'
import type { MemberResponse, MemberWrite } from '../../features/members/types'
import { LoadingState } from '../ui/LoadingState'
import { FriendlyTime } from '../ui/FriendlyTime'
import { MemberEditor } from './members/MemberEditor'
import { MemberCredential } from './members/MemberCredential'
import './AdminMembers.css'

export default function AdminMembers() {
  const dispatch = useAppDispatch()
  const { days } = useAdminFilters()
  const user = useAppSelector((state) => state.auth.user)
  const { busy, error } = useAppSelector((state) => state.membersUi)
  const query = membersApi.useGetAdminMembersQuery(undefined, {
    pollingInterval: busy ? 0 : 30000,
    skipPollingIfUnfocused: true,
  })
  const [selection, setSelection] = useState<number | 'new' | null>(null)
  // Only mounted component state holds a one-time temporary password.
  const [credential, setCredential] = useState<MemberResponse | null>(null)
  const [feedback, setFeedback] = useState('')
  const member = query.data?.members.find((item) => item.id === selection)
  const changeSelection = (value: typeof selection) => {
    setSelection(value)
    setCredential(null)
    setFeedback('')
    dispatch(membersUiReset())
  }
  async function save(write: MemberWrite) {
    const result = await dispatch(executeMemberWrite(write))
    if (!result) return
    setSelection(null)
    setFeedback(
      write.action === 'password'
        ? `Password reset for ${result.member.familyName}.`
        : `Account ${write.action === 'add' ? 'created' : 'saved'} for ${result.member.familyName}.`,
    )
    if (result.temporaryPassword) setCredential(result)
  }
  if (!user) return null
  return (
    <section className="admin-members" aria-labelledby="admin-members-heading">
      <header className="admin-members__header">
        <div>
          <h2 id="admin-members-heading">Family members</h2>
          <p className="note">
            Manage accounts, nicknames and sign-in support. Every change is recorded in activity.
          </p>
        </div>
        <button
          type="button"
          disabled={busy || selection === 'new'}
          onClick={() => changeSelection('new')}
        >
          Add family member
        </button>
      </header>
      {feedback && <p role="status">{feedback}</p>}
      {credential && <MemberCredential result={credential} onDismiss={() => setCredential(null)} />}
      {(selection === 'new' || member) && (
        <MemberEditor
          key={selection}
          member={member}
          selfId={user.id}
          busy={busy}
          error={error?.message ?? ''}
          onSave={save}
          onCancel={() => changeSelection(null)}
          onClearError={() => dispatch(membersUiReset())}
        />
      )}
      {query.error && (
        <div>
          <p className="error" role="alert">
            {shoppingError(query.error)?.message ?? 'Unable to load family accounts.'}
          </p>
          <button
            type="button"
            className="secondary"
            disabled={busy}
            onClick={() => void query.refetch()}
          >
            Try again
          </button>
        </div>
      )}
      {!query.data && query.isLoading ? (
        <LoadingState label="Loading family accounts…" />
      ) : (
        <ul className="admin-members__grid">
          {query.data?.members.map((item) => (
            <li className="admin-members__card" key={item.id}>
              <div>
                <h3>
                  {item.familyName}
                  {item.id === user.id && <span className="admin-members__you">You</span>}
                </h3>
                <p className="note">
                  {item.displayName} · @{item.username}
                </p>
              </div>
              <div className="admin-members__badges">
                <span className="status-label">
                  {item.role === 'admin' ? 'Administrator' : 'Family member'}
                </span>
                <span className="status-label">{item.enabled ? 'Active' : 'Access paused'}</span>
              </div>
              <div className="admin-members__support">
                {item.mustChangePassword && (
                  <p className="note">Password change required at sign-in</p>
                )}
                <p className="note">
                  Joined <FriendlyTime value={item.createdAt} />
                </p>
              </div>
              <button
                type="button"
                className="secondary"
                disabled={busy || selection === item.id}
                onClick={() => changeSelection(item.id)}
                aria-label={`Edit account for ${item.familyName}`}
              >
                Edit account
              </button>
            </li>
          ))}
        </ul>
      )}
      <Link to={`/admin?view=activity&type=user_account&days=${days}`}>
        View account changes in activity
      </Link>
    </section>
  )
}
