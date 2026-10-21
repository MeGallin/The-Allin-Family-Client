import { useEffect, useState, type FormEvent } from 'react'
import {
  ApiError, changePassword, getFamilyHome, getSession, signIn, signOut,
  type FamilyHome, type FamilySession,
} from './auth-api'

function messageFor(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.'
}

function LoginForm({ onSession }: { onSession: (session: FamilySession) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const session = await signIn(username, password)
      setPassword('')
      onSession(session)
    } catch (failure) {
      if (failure instanceof ApiError && failure.code === 'csrf_failed') {
        await getSession().catch(() => undefined)
      }
      setError(messageFor(failure))
    } finally { setBusy(false) }
  }
  return (
    <section aria-labelledby="sign-in-title">
      <h2 id="sign-in-title">Family sign in</h2>
      <p>Sign in with your own family account.</p>
      <form onSubmit={submit}>
        <label htmlFor="username">Username</label>
        <input id="username" name="username" autoComplete="username" autoCapitalize="none" spellCheck={false}
          required maxLength={64} value={username} onChange={(event) => setUsername(event.target.value)} />
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required
          maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} />
        {error && <p className="error" role="alert">{error}</p>}
        <button disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
      <p className="note">Accounts are provided by the family administrator. Public registration is closed.</p>
    </section>
  )
}

function PasswordForm({ required, onSession, onCancel }: {
  required: boolean; onSession: (session: FamilySession) => void; onCancel: () => void
}) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (newPassword !== confirmation) { setError('The new passwords do not match.'); return }
    setBusy(true)
    try {
      onSession(await changePassword(currentPassword, newPassword))
      setCurrentPassword(''); setNewPassword(''); setConfirmation('')
    } catch (failure) { setError(messageFor(failure)) }
    finally { setBusy(false) }
  }
  return (
    <section aria-labelledby="change-password-title">
      <h2 id="change-password-title">{required ? 'Choose your own password' : 'Change your password'}</h2>
      <p>{required ? 'Replace your temporary password to enter the family space.' : 'Updating your password signs out your other sessions.'}</p>
      <form onSubmit={submit}>
        <label htmlFor="current-password">{required ? 'Temporary password' : 'Current password'}</label>
        <input id="current-password" type="password" autoComplete="current-password" required maxLength={128}
          value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
        <label htmlFor="new-password">New password</label>
        <input id="new-password" type="password" autoComplete="new-password" required minLength={15} maxLength={128}
          aria-describedby="password-help" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
        <p className="note" id="password-help">Use a unique passphrase of at least 15 characters.</p>
        <label htmlFor="confirm-password">Confirm new password</label>
        <input id="confirm-password" type="password" autoComplete="new-password" required minLength={15} maxLength={128}
          value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
        {error && <p className="error" role="alert">{error}</p>}
        <div className="actions">
          <button disabled={busy}>{busy ? 'Saving…' : 'Save password'}</button>
          {!required && <button type="button" className="secondary" onClick={onCancel} disabled={busy}>Cancel</button>}
        </div>
      </form>
    </section>
  )
}

function PrivateHome({ onExpired }: { onExpired: () => void }) {
  const [home, setHome] = useState<FamilyHome | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    const controller = new AbortController()
    getFamilyHome(controller.signal).then(setHome).catch((failure: unknown) => {
      if (controller.signal.aborted) return
      if (failure instanceof ApiError && failure.status === 401) onExpired()
      else setError(messageFor(failure))
    })
    return () => controller.abort()
  }, [onExpired])
  return (
    <section aria-labelledby="home-title">
      <h2 id="home-title">Our family space</h2>
      {error ? <p className="error" role="alert">{error}</p> : !home ? <p role="status">Opening your family space…</p> : (
        <>
          <p>{home.message}</p>
          <p>Your shared calendar, lists and family updates will live here as we add them.</p>
        </>
      )}
    </section>
  )
}

export default function App() {
  const [session, setSession] = useState<FamilySession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [reload, setReload] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    getSession(controller.signal).then((value) => {
      if (!controller.signal.aborted) setSession(value)
    }).catch((failure: unknown) => {
      if (!controller.signal.aborted) setError(messageFor(failure))
    }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [reload])
  function acceptSession(value: FamilySession) {
    setSession(value); setChangingPassword(false); setError('')
  }
  async function logout() {
    setLoggingOut(true)
    setError('')
    try {
      await signOut()
      setSession(null)
      setChangingPassword(false)
      setReload((value) => value + 1)
    }
    catch (failure) { setError(messageFor(failure)) }
    finally { setLoggingOut(false) }
  }
  const user = session?.user
  return (
    <main>
      <p className="eyebrow">theallinfamily.co.uk</p>
      <h1>{import.meta.env.VITE_APP_NAME || 'The Allin Family'}</h1>
      <p className="intro">A place for all of us.</p>
      {loading ? <p role="status">Checking your session…</p> : error && !session ? (
        <section><p className="error" role="alert">{error}</p><button onClick={() => setReload((value) => value + 1)}>Try again</button></section>
      ) : !user ? <LoginForm onSession={acceptSession} /> : (
        <>
          <div className="account-bar">
            <p>Signed in as <strong>{user.displayName}</strong></p>
            <button className="secondary" onClick={logout} disabled={loggingOut}>{loggingOut ? 'Signing out…' : 'Sign out'}</button>
          </div>
          {error && <p className="error" role="alert">{error}</p>}
          {user.mustChangePassword || changingPassword ? (
            <PasswordForm required={user.mustChangePassword} onSession={acceptSession} onCancel={() => setChangingPassword(false)} />
          ) : (
            <>
              <PrivateHome onExpired={() => { setSession(null); setReload((value) => value + 1) }} />
              <button className="text-button" onClick={() => setChangingPassword(true)}>Change password</button>
            </>
          )}
        </>
      )}
    </main>
  )
}
