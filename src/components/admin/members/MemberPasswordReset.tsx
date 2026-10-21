import { useState } from 'react'
import type { AdminMember } from '../../../features/members/types'
import './MemberPasswordReset.css'
export function MemberPasswordReset({
  member,
  self,
  busy,
  onReset,
}: {
  member: AdminMember
  self: boolean
  busy: boolean
  onReset: () => Promise<void>
}) {
  const [confirming, setConfirming] = useState(false)
  return (
    <section className="member-password" aria-label="Password support">
      <h4>Password support</h4>
      {self ? (
        <p className="note">
          Use Change password from the account menu to change your own password.
        </p>
      ) : (
        <>
          <p className="note">
            {member.enabled
              ? 'Issue a new temporary password if they need help signing in. This signs them out everywhere. They must choose their own password at their next sign-in.'
              : 'Restore account access and save before resetting their password.'}
          </p>
          {confirming ? (
            <div className="member-password__confirm">
              <p>
                Reset the password for <strong>{member.familyName}</strong>? Their current password
                will stop working immediately.
              </p>
              <div className="actions">
                <button
                  type="button"
                  disabled={busy || !member.enabled}
                  onClick={() => void onReset()}
                >
                  {busy ? 'Resetting…' : 'Confirm password reset'}
                </button>
                <button
                  type="button"
                  className="secondary"
                  disabled={busy}
                  onClick={() => setConfirming(false)}
                >
                  Cancel reset
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="secondary"
              disabled={busy || !member.enabled}
              onClick={() => setConfirming(true)}
            >
              Reset password
            </button>
          )}
        </>
      )}
    </section>
  )
}
