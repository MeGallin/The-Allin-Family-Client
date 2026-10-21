import { useEffect, useState } from 'react'
import { ApiError } from '../services/api-client'
import { getFamilyHome, type FamilyHomeResponse } from '../services/family-api'
import { messageFor } from '../lib/errors'

export function useFamilyHome(onExpired: () => void) {
  const [home, setHome] = useState<FamilyHomeResponse | null>(null)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setError('')
    setHome(null)
    getFamilyHome(controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) setHome(value)
      })
      .catch((failure: unknown) => {
        if (controller.signal.aborted) return
        if (
          failure instanceof ApiError &&
          (failure.status === 401 || failure.code === 'password_change_required')
        )
          onExpired()
        else setError(messageFor(failure))
      })
    return () => controller.abort()
  }, [onExpired, attempt])

  return { home, error, retry: () => setAttempt((value) => value + 1) }
}
