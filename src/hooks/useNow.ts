import { useSyncExternalStore } from 'react'

// One clock for all date labels, regardless of how many shopping rows are visible.
let now = Date.now()
const listeners = new Set<() => void>()
let stop: (() => void) | undefined
function tick() {
  now = Date.now()
  listeners.forEach((listener) => listener())
}
function subscribe(listener: () => void) {
  listeners.add(listener)
  if (listeners.size === 1) {
    const timer = window.setInterval(tick, 30000)
    const visible = () => {
      if (!document.hidden) tick()
    }
    window.addEventListener('focus', tick)
    document.addEventListener('visibilitychange', visible)
    stop = () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', tick)
      document.removeEventListener('visibilitychange', visible)
    }
    tick()
  }
  return () => {
    listeners.delete(listener)
    if (!listeners.size) {
      stop?.()
      stop = undefined
    }
  }
}
export function useNow() {
  return useSyncExternalStore(
    subscribe,
    () => now,
    () => now,
  )
}
