import { useState, type FormEvent } from 'react'
import { ApiError, getSession, signIn, type FamilySession } from '../../auth-api'
import { messageFor } from '../../lib/errors'
import './LoginForm.css'

type LoginFormProps = {
  onSession: (session: FamilySession) => void
}

export function LoginForm({ onSession }: LoginFormProps) {
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
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="surface-card login-card" aria-labelledby="sign-in-title">
      <h2 id="sign-in-title">Family sign in</h2>
      <p className="login-intro">Sign in with your own family account.</p>
      <form onSubmit={submit}>
        <label htmlFor="username">Username</label>
        <input
          id="username"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          maxLength={64}
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={128}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {error && <p className="error form-error" role="alert">{error}</p>}
        <button type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
      <p className="note login-note">Accounts are provided by the family administrator. Public registration is closed.</p>
    </section>
  )
}
