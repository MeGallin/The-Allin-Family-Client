import { useSyncExternalStore } from 'react'
import { useLocation } from 'react-router'
import { activeBuiltinWidget } from '../features/widgets/builtin-widgets'
import { useAppSelector } from '../app/store-hooks'

function subscribe(listener: () => void) {
  document.addEventListener('visibilitychange', listener)
  window.addEventListener('online', listener)
  window.addEventListener('offline', listener)
  return () => {
    document.removeEventListener('visibilitychange', listener)
    window.removeEventListener('online', listener)
    window.removeEventListener('offline', listener)
  }
}
const canRefresh = () => document.visibilityState === 'visible' && navigator.onLine

/** Shared reads follow the visible route; queued removals retain their safety snapshot. */
export function useLiveQueryOptions(path: string, busy = false, always = false) {
  const { pathname, search } = useLocation()
  const activeTool =
    pathname === '/my-space' ? activeBuiltinWidget(new URLSearchParams(search)) : undefined
  const queued = useAppSelector((state) =>
    Object.values(state.removals.entries).some(
      (entry) =>
        '/' + entry.domain === path ||
        (entry.domain === 'shopping' && path === '/lists') ||
        (path === '/my-space' &&
          ['widgets', 'widgetMeals', 'sudoku', 'dailyWord', 'focusTimer'].includes(entry.domain)),
    ),
  )
  const foreground = useSyncExternalStore(subscribe, canRefresh, () => false)
  const needed =
    always ||
    pathname === '/' ||
    pathname === path ||
    activeTool?.legacyPath === path ||
    queued ||
    busy
  return {
    skip: !needed || (!foreground && !queued && !busy),
    pollingInterval: needed && foreground && !busy ? (always ? 60_000 : 15_000) : 0,
    skipPollingIfUnfocused: true,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: needed && !busy,
    refetchOnReconnect: needed && foreground,
  }
}
