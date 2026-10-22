import { useCallback, useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router'
type Changes = Readonly<Record<string, string | null>>
/** Merge updates atomically, preserving editor/route parameters and browser navigation. */
export function useUrlFilters({ replace = true }: { replace?: boolean } = {}) {
  const location = useLocation()
  const navigate = useNavigate()
  const latest = useRef(location)
  const pending = useRef<string[]>([])
  const signature = (value: { pathname: string; search: string; hash: string }) =>
    value.pathname + value.search + value.hash
  useLayoutEffect(() => {
    const index = pending.current.lastIndexOf(signature(location))
    if (index >= 0) {
      // An earlier navigation may commit while a newer filter update is in flight.
      pending.current.splice(0, index + 1)
      if (!pending.current.length) latest.current = location
    } else {
      // Browser Back/Forward and other route changes become the new baseline.
      pending.current = []
      latest.current = location
    }
  }, [location])
  const update = useCallback(
    (
      changes: Changes,
      { clear = [], clearHash = false }: { clear?: readonly string[]; clearHash?: boolean } = {},
    ) => {
      const current = latest.current
      const params = new URLSearchParams(current.search)
      for (const key of clear) params.delete(key)
      for (const [key, value] of Object.entries(changes)) {
        if (value !== null && value !== '') params.set(key, value)
        else params.delete(key)
      }
      const query = params.toString()
      const next = {
        ...current,
        search: query ? '?' + query : '',
        hash: clearHash ? '' : current.hash,
      }
      // Router setters are not queued React updates: retain rapid consecutive selections.
      latest.current = next
      if (next.search !== current.search || next.hash !== current.hash) {
        pending.current.push(signature(next))
        void navigate(
          { pathname: next.pathname, search: next.search, hash: next.hash },
          { replace },
        )
      }
    },
    [navigate, replace],
  )
  return { params: new URLSearchParams(location.search), update }
}
