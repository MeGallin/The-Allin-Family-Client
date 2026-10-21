import { useState, type FormEvent } from 'react'
import { changePassword } from '../../services/auth-api'
import type { FamilySession } from '../../types/auth'
import { messageFor } from '../../lib/errors'
import './PasswordForm.css'

type PasswordFormProps = {
  required: boolean
  onSession: (session: FamilySession) => void
  onCancel: () => void
}

export function PasswordForm({ required, onSession, onCancel }: PasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (newPassword !== confirmation) {
      setError('The new passwords do not match.')
      return
    }
    setBusy(true)
    try {
      onSession(await changePassword(currentPassword, newPassword))
      setCurrentPassword('')
      setNewPassword('')
      setConfirmation('')
    } catch (failure) {
      setError(messageFor(failure))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="surface-card password-card" aria-labelledby="change-password-title">
      <h2 id="change-password-title">
        {required ? 'Choose your own password' : 'Change your password'}
      </h2>
      <p className="password-intro">
        {required
          ? 'Replace your temporary password to enter the family space.'
          : 'Updating your password signs out your other sessions.'}
      </p>
      <form onSubmit={submit}>
        <label htmlFor="current-password">
          {required ? 'Temporary password' : 'Current password'}
        </label>
        <input
          id="current-password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={128}
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
        />
        <label htmlFor="new-password">New password</label>
        <input
          id="new-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={15}
          maxLength={128}
          aria-describedby="password-help"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
        />
        <p className="note password-help" id="password-help">
          Use a unique passphrase of at least 15 characters.
        </p>
        <label htmlFor="confirm-password">Confirm new password</label>
        <input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={15}
          maxLength={128}
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
        />
        {error && (
          <p className="error form-error" role="alert">
            {error}
          </p>
        )}
        <div className="actions">
          <button type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Save password'}
          </button>
          {!required && (
            <button type="button" className="secondary" onClick={onCancel} disabled={busy}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </section>
  )
}
