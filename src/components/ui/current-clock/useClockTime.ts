import { useSyncExternalStore } from 'react'

// Separate from the app's 30-second date/query cadence. All clock faces share
// one visible-only, wall-clock-aligned presentation timer.
let now = Date.now()
let timer: number | undefined
const listeners = new Set<() => void>()
function clear() {
  if (timer !== undefined) window.clearTimeout(timer)
  timer = undefined
}
function sync() {
  clear()
  if (document.hidden || !listeners.size) return
  now = Date.now()
  listeners.forEach((listener) => listener())
  timer = window.setTimeout(sync, 1000 - (Date.now() % 1000))
}
function subscribe(listener: () => void) {
  listeners.add(listener)
  if (listeners.size === 1) {
    document.addEventListener('visibilitychange', sync)
    window.addEventListener('focus', sync)
    sync()
  }
  return () => {
    listeners.delete(listener)
    if (!listeners.size) {
      clear()
      document.removeEventListener('visibilitychange', sync)
      window.removeEventListener('focus', sync)
    }
  }
}
const snapshot = () => now
export function useClockTime() {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}
