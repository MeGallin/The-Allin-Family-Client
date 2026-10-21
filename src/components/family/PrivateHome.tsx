import { useEffect, useState } from 'react'
import { ApiError, getFamilyHome, type FamilyHome as FamilyHomeData } from '../../auth-api'
import { messageFor } from '../../lib/errors'
import './PrivateHome.css'

type PrivateHomeProps = {
  onExpired: () => void
}

export function PrivateHome({ onExpired }: PrivateHomeProps) {
  const [home, setHome] = useState<FamilyHomeData | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    getFamilyHome(controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) setHome(value)
      })
      .catch((failure: unknown) => {
        if (controller.signal.aborted) return
        if (failure instanceof ApiError && failure.status === 401) onExpired()
        else setError(messageFor(failure))
      })

    return () => controller.abort()
  }, [onExpired])

  return (
    <section className="surface-card family-home-card" aria-labelledby="home-title">
      <h2 id="home-title">Our family space</h2>
      {error ? (
        <p className="error" role="alert">{error}</p>
      ) : !home ? (
        <p role="status">Opening your family space…</p>
      ) : (
        <>
          <p className="family-home-message">{home.message}</p>
          <p>Your shared calendar, lists and family updates will live here as we add them.</p>
        </>
      )}
    </section>
  )
}
