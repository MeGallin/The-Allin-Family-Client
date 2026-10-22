import { useDraftGuard } from '../../../features/drafts/DraftProtection'
import { DraftConflict } from '../../ui/DraftConflict'
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import type { AdminMember, MemberDraft, MemberWrite } from '../../../features/members/types'
import { MemberPasswordReset } from './MemberPasswordReset'
import './MemberEditor.css'

type Props = {
  member?: AdminMember
  selfId: number
  busy: boolean
  error: string
  onSave: (write: MemberWrite) => Promise<void>
  onCancel: () => void
  onClearError: () => void
}
export function MemberEditor({
  member,
  selfId,
  busy,
  error,
  onSave,
  onCancel,
  onClearError,
}: Props) {
  const id = useId()
  const heading = useRef<HTMLHeadingElement>(null)
  const [baseline, setBaseline] = useState<MemberDraft>({
    username: member?.username ?? '',
    displayName: member?.displayName ?? '',
    nickname: member?.nickname ?? '',
    role: member?.role ?? 'member',
    enabled: member?.enabled ?? true,
  })
  const [draft, setDraft] = useState(baseline)
  const guard = useDraftGuard(JSON.stringify(draft) !== JSON.stringify(baseline), busy)
  const [version, setVersion] = useState(member?.profileVersion ?? 1)
  const self = member?.id === selfId
  const conflict = member !== undefined && member.profileVersion !== version
  useEffect(() => {
    heading.current?.focus()
  }, [])
  const field = (key: 'username' | 'displayName' | 'nickname', value: string) =>
    setDraft((previous) => ({ ...previous, [key]: value }))
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (busy || conflict) return
    await onSave(
      member
        ? { action: 'edit', body: { ...draft, id: member.id, version } }
        : { action: 'add', body: draft },
    )
  }
  return (
    <section className="surface-card member-editor" aria-labelledby={id + '-heading'}>
      <h3 id={id + '-heading'} ref={heading} tabIndex={-1}>
        {member ? `Edit ${member.familyName}` : 'Add a family member'}
      </h3>
      <p className="note">
        {member
          ? 'Update their account details and the name the family sees.'
          : 'Create their account, then share the temporary sign-in details with them privately.'}
      </p>
      <form onSubmit={submit}>
        <fieldset disabled={busy} className="member-editor__fields">
          <div>
            <label htmlFor={id + '-name'}>Full name</label>
            <input
              id={id + '-name'}
              value={draft.displayName}
              maxLength={120}
              required
              autoComplete="off"
              onChange={(event) => field('displayName', event.target.value)}
            />
          </div>
          <div>
            <label htmlFor={id + '-nickname'}>Nickname</label>
            <input
              id={id + '-nickname'}
              value={draft.nickname}
              maxLength={40}
              autoComplete="off"
              aria-describedby={id + '-nickname-help'}
              onChange={(event) => field('nickname', event.target.value)}
            />
            <p className="note" id={id + '-nickname-help'}>
              Leave blank to use their first name.
            </p>
          </div>
          <div className="member-editor__wide">
            <label htmlFor={id + '-username'}>Sign-in username</label>
            <input
              id={id + '-username'}
              value={draft.username}
              minLength={3}
              maxLength={64}
              required
              pattern="[a-zA-Z0-9][a-zA-Z0-9._\-]{2,63}"
              autoCapitalize="none"
              spellCheck={false}
              autoComplete="off"
              aria-describedby={id + '-username-help'}
              onChange={(event) => field('username', event.target.value)}
            />
            <p className="note" id={id + '-username-help'}>
              3–64 letters, numbers, dots, underscores or hyphens. Saved in lowercase. Changing it
              changes how they sign in.
            </p>
          </div>
          <div>
            <label htmlFor={id + '-role'}>Role</label>
            <select
              id={id + '-role'}
              value={draft.role}
              disabled={self}
              onChange={(event) =>
                setDraft({ ...draft, role: event.target.value as MemberDraft['role'] })
              }
            >
              <option value="member">Family member</option>
              <option value="admin">Administrator</option>
            </select>
            <p className="note">Administrators can manage accounts and see activity and usage.</p>
          </div>
          {member && (
            <div>
              <label htmlFor={id + '-access'}>Account access</label>
              <select
                id={id + '-access'}
                value={draft.enabled ? 'active' : 'paused'}
                disabled={self}
                onChange={(event) =>
                  setDraft({ ...draft, enabled: event.target.value === 'active' })
                }
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </select>
              <p className="note">
                Pausing blocks sign-in and ends their sessions. Their content stays saved.
              </p>
            </div>
          )}
        </fieldset>
        {self && <p className="note">Your own administrator role and access are protected.</p>}
        {conflict && (
          <DraftConflict
            key={member.profileVersion}
            before={baseline}
            mine={draft}
            latest={{
              username: member.username,
              displayName: member.displayName,
              nickname: member.nickname ?? '',
              role: member.role,
              enabled: member.enabled,
            }}
            labels={{
              username: 'Username',
              displayName: 'Full name',
              nickname: 'Nickname',
              role: 'Role',
              enabled: 'Account access enabled',
            }}
            onResolve={(merged) => {
              setBaseline({
                username: member.username,
                displayName: member.displayName,
                nickname: member.nickname ?? '',
                role: member.role,
                enabled: member.enabled,
              })
              setDraft(merged)
              setVersion(member.profileVersion)
              onClearError()
              heading.current?.focus()
            }}
          />
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="actions">
          <button type="submit" disabled={busy || conflict}>
            {busy ? 'Saving…' : member ? 'Save changes' : 'Create account'}
          </button>
          <button
            type="button"
            className="secondary"
            disabled={busy}
            onClick={() => guard.close(onCancel)}
          >
            Cancel
          </button>
        </div>
      </form>
      {member && (
        <MemberPasswordReset
          member={member}
          self={self}
          busy={busy || conflict}
          onReset={async () =>
            guard.close(() => {
              void onSave({ action: 'password', body: { id: member.id, version } })
            })
          }
        />
      )}
    </section>
  )
}
