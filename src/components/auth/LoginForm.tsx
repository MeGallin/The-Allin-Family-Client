import { useState, type FormEvent } from 'react'
import { ApiError } from '../../services/api-client'
import { getSession, signIn } from '../../services/auth-api'
import type { FamilySession } from '../../types/auth'
import { messageFor } from '../../lib/errors'
import { FamilyBrand } from '../brand/FamilyBrand'
import { CockatielMascot } from '../mascot/CockatielMascot'
import { PasswordInput } from '../ui/PasswordInput'
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
    <div className="login-scene">
      <section className="login-card" aria-labelledby="sign-in-title">
        <CockatielMascot className="login-mascot" />
        <header className="login-heading">
          <h1 className="login-brand" aria-label="The Allin Family">
            <FamilyBrand size="large" />
          </h1>
          <div className="login-message">
            <p className="login-tagline">
              A place for
              <br /> all of us.
            </p>
            <p className="login-caption">Plans, memories and everyday moments, together.</p>
          </div>
        </header>
        <div className="login-panel">
          <h2 id="sign-in-title">Welcome home.</h2>
          <p className="login-intro">Sign in to your family space.</p>
          <form className="login-form" onSubmit={submit}>
            <div className="login-field">
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
            </div>
            <div className="login-field">
              <label htmlFor="password">Password</label>
              <PasswordInput
                id="password"
                name="password"
                autoComplete="current-password"
                required
                maxLength={128}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            {error && (
              <p className="error form-error" role="alert">
                {error}
              </p>
            )}
            <button type="submit" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <p className="login-note">Need an account? Ask your family administrator.</p>
        </div>
      </section>
    </div>
  )
}
