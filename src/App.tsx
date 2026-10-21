import { useCallback, useEffect, useState } from 'react'
import { getSession, signOut, type FamilySession } from './auth-api'
import { messageFor } from './lib/errors'
import { LoginForm } from './components/auth/LoginForm'
import { PasswordForm } from './components/auth/PasswordForm'
import { PrivateHome } from './components/family/PrivateHome'
import './App.css'

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
    getSession(controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) setSession(value)
      })
      .catch((failure: unknown) => {
        if (!controller.signal.aborted) setError(messageFor(failure))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [reload])

  const acceptSession = useCallback((value: FamilySession) => {
    setSession(value)
    setChangingPassword(false)
    setError('')
  }, [])

  const handleSessionExpired = useCallback(() => {
    setSession(null)
    setReload((value) => value + 1)
  }, [])

  async function logout() {
    setLoggingOut(true)
    setError('')
    try {
      await signOut()
      setSession(null)
      setChangingPassword(false)
      setReload((value) => value + 1)
    } catch (failure) {
      setError(messageFor(failure))
    } finally {
      setLoggingOut(false)
    }
  }

  const user = session?.user

  return (
    <main className="app-shell">
      <p className="eyebrow">theallinfamily.co.uk</p>
      <h1 className="app-title">{import.meta.env.VITE_APP_NAME || 'The Allin Family'}</h1>
      <p className="intro">A place for all of us.</p>

      {loading ? (
        <p className="app-status" role="status">Checking your session…</p>
      ) : error && !session ? (
        <section className="surface-card app-error-card">
          <p className="error" role="alert">{error}</p>
          <button type="button" onClick={() => setReload((value) => value + 1)}>Try again</button>
        </section>
      ) : !user ? (
        <LoginForm onSession={acceptSession} />
      ) : (
        <>
          <div className="account-bar">
            <p>Signed in as <strong>{user.displayName}</strong></p>
            <button type="button" className="secondary" onClick={logout} disabled={loggingOut}>
              {loggingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
          {error && <p className="error app-inline-error" role="alert">{error}</p>}
          {user.mustChangePassword || changingPassword ? (
            <PasswordForm
              required={user.mustChangePassword}
              onSession={acceptSession}
              onCancel={() => setChangingPassword(false)}
            />
          ) : (
            <>
              <PrivateHome onExpired={handleSessionExpired} />
              <button type="button" className="text-button" onClick={() => setChangingPassword(true)}>
                Change password
              </button>
            </>
          )}
        </>
      )}
    </main>
  )
}
