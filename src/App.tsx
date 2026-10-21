import { useEffect, useState } from 'react'
import { getHealth, type Health } from './api'

type Connection =
  | { state: 'loading' }
  | { state: 'connected'; health: Health }
  | { state: 'error'; message: string }

export default function App() {
  const [attempt, setAttempt] = useState(0)
  const [connection, setConnection] = useState<Connection>({ state: 'loading' })

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    let timedOut = false
    const timeout = window.setTimeout(() => {
      timedOut = true
      controller.abort()
    }, 8000)

    setConnection({ state: 'loading' })
    getHealth(controller.signal)
      .then((health) => {
        if (active && !controller.signal.aborted) setConnection({ state: 'connected', health })
      })
      .catch((error: unknown) => {
        if (!active || (controller.signal.aborted && !timedOut)) return
        setConnection({
          state: 'error',
          message: timedOut ? 'The API did not respond within eight seconds.'
            : error instanceof Error ? error.message : 'Unable to contact the API.',
        })
      })
      .finally(() => window.clearTimeout(timeout))

    return () => {
      active = false
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [attempt])

  return (
    <main>
      <p className="eyebrow">Local development</p>
      <h1>{import.meta.env.VITE_APP_NAME || 'The Allin Family'}</h1>
      <p className="intro">The starting point for our family website.</p>
      <section aria-labelledby="connection-title">
        <h2 id="connection-title">PHP API connection</h2>
        <div role="status" aria-live="polite">
          {connection.state === 'loading' && <p>Checking the connection…</p>}
          {connection.state === 'connected' && (
            <p className="success">Connected to {connection.health.service}.</p>
          )}
          {connection.state === 'error' && (
            <>
              <p className="error">{connection.message}</p>
              <p>Start the PHP API, then check the connection again.</p>
            </>
          )}
        </div>
        <button disabled={connection.state === 'loading'} onClick={() => setAttempt((value) => value + 1)}>
          Check connection
        </button>
      </section>
      <p className="note">Development starter only. Accounts, calendars and database features have not been added.</p>
    </main>
  )
}
