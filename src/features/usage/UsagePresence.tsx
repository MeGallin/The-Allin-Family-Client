import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router'
import { useAppSelector } from '../../app/store-hooks'
import { sendPresence } from '../../services/usage-api'
import { ApiError } from '../../services/api-client'

const HEARTBEAT_MS = 30_000
const IDLE_MS = 60_000

/** One tracker per signed-in app: background data polling is never user activity. */
export function UsagePresence({ onSessionExpired }: { onSessionExpired: () => void }) {
  const { pathname } = useLocation()
  const userId = useAppSelector((state) => state.auth.user?.id)
  const generation = useAppSelector((state) => state.auth.generation)
  const expired = useRef(onSessionExpired)
  const page = useRef(pathname)
  const routeChanged = useRef<(() => void) | null>(null)
  useEffect(() => {
    expired.current = onSessionExpired
  }, [onSessionExpired])
  useEffect(() => {
    page.current = pathname
    routeChanged.current?.()
  }, [pathname])

  useEffect(() => {
    if (!userId) return
    let lastInput = Date.now()
    let inFlight: AbortController | null = null
    let stopped = false
    const report = () => {
      if (stopped || inFlight) return
      const controller = new AbortController()
      inFlight = controller
      const active = document.visibilityState === 'visible' && Date.now() - lastInput < IDLE_MS
      void sendPresence(page.current, active, controller.signal)
        .catch((error: unknown) => {
          if (
            !stopped &&
            error instanceof ApiError &&
            (error.status === 401 || error.code === 'password_change_required')
          ) {
            stopped = true
            expired.current()
          }
          // Usage must never interrupt a person's content or produce unhandled network errors.
        })
        .finally(() => {
          if (inFlight === controller) inFlight = null
        })
    }
    const input = () => {
      const wasIdle = Date.now() - lastInput >= IDLE_MS
      lastInput = Date.now()
      if (wasIdle) report()
    }
    const visibility = () => report()
    const navigation = () => {
      lastInput = Date.now()
      report()
    }
    // A scroll event can come from layout/scroll anchoring or scripted scrolling.
    // Count input intent instead, so live timestamp updates cannot restart idle time.
    const events = ['pointerdown', 'keydown', 'wheel', 'touchstart', 'touchmove'] as const
    events.forEach((event) =>
      window.addEventListener(event, input, { passive: true, capture: true }),
    )
    document.addEventListener('visibilitychange', visibility)
    routeChanged.current = navigation
    report()
    const timer = window.setInterval(() => {
      // One final inactive signal on hide; no periodic network traffic in hidden tabs.
      if (document.visibilityState === 'visible') report()
    }, HEARTBEAT_MS)
    return () => {
      stopped = true
      inFlight?.abort()
      window.clearInterval(timer)
      routeChanged.current = null
      events.forEach((event) => window.removeEventListener(event, input, true))
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [userId, generation])
  return null
}
