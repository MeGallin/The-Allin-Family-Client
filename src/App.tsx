import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { getSession, signOut } from './services/auth-api'
import type { FamilySession } from './types/auth'
import { messageFor } from './lib/errors'
import { LoginForm } from './components/auth/LoginForm'
import { LoadingState } from './components/ui/LoadingState'
import './App.css'

const FamilyApp = lazy(() => import('./app/FamilyApp'))
const PasswordForm = lazy(() =>
  import('./components/auth/PasswordForm').then((module) => ({ default: module.PasswordForm })),
)

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

  useEffect(() => {
    if (!user || user.mustChangePassword || changingPassword) {
      document.title =
        changingPassword || user?.mustChangePassword
          ? 'Password settings · The Allin Family'
          : 'The Allin Family'
    }
  }, [user, changingPassword])

  if (!loading && user && !user.mustChangePassword && !changingPassword) {
    return (
      <Suspense
        fallback={
          <main className="app-shell">
            <LoadingState />
          </main>
        }
      >
        <FamilyApp
          onSessionExpired={handleSessionExpired}
          onChangePassword={() => setChangingPassword(true)}
          onLogout={logout}
          loggingOut={loggingOut}
          error={error}
        />
      </Suspense>
    )
  }

  return (
    <main className="app-shell">
      <p className="eyebrow">theallinfamily.co.uk</p>
      <h1 className="app-title">{import.meta.env.VITE_APP_NAME || 'The Allin Family'}</h1>
      <p className="intro">A place for all of us.</p>

      {loading ? (
        <LoadingState label="Checking your session…" />
      ) : error && !session ? (
        <section className="surface-card app-error-card">
          <p className="error" role="alert">
            {error}
          </p>
          <button type="button" onClick={() => setReload((value) => value + 1)}>
            Try again
          </button>
        </section>
      ) : !user ? (
        <LoginForm onSession={acceptSession} />
      ) : (
        <>
          <div className="account-bar">
            <p>
              Signed in as <strong>{user.displayName}</strong>
            </p>
            <button type="button" className="secondary" onClick={logout} disabled={loggingOut}>
              {loggingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
          {error && (
            <p className="error app-inline-error" role="alert">
              {error}
            </p>
          )}
          <Suspense fallback={<LoadingState label="Opening password settings…" />}>
            <PasswordForm
              required={user.mustChangePassword}
              onSession={acceptSession}
              onCancel={() => setChangingPassword(false)}
            />
          </Suspense>
        </>
      )}
    </main>
  )
}
