import { useEffect } from 'react'
import { useLocation } from 'react-router'

// Resolve anchors after lazy pages and saved data have mounted, with keyboard focus.
export function useHashTarget(ready = true) {
  const { hash, key } = useLocation()
  useEffect(() => {
    if (!ready || !hash) return
    let id: string
    try {
      id = decodeURIComponent(hash.slice(1))
    } catch {
      return
    }
    const target = document.getElementById(id)
    if (!target) return
    target.scrollIntoView({
      block: 'start',
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
    })
    target.focus({ preventScroll: true })
  }, [hash, key, ready])
}
