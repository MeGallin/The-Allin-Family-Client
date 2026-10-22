import { useState } from 'react'

type Options = { viewKey?: string; targetId?: string | null; pageSize?: number }
/** Filter the full saved collection first, then mount a small window of results. */
export function useCollectionWindow<T extends { id: string }>(
  items: T[],
  { viewKey = '', targetId, pageSize = 20 }: Options = {},
) {
  const [state, setWindow] = useState({ key: viewKey, count: pageSize })
  // Reset the stored key too, so returning to an earlier filter cannot revive its old window.
  if (state.key !== viewKey) setWindow({ key: viewKey, count: pageSize })
  const count = state.key === viewKey ? state.count : pageSize
  const shown = items.slice(0, count)
  // Deep links reveal their target without mounting every earlier card.
  const target = targetId ? items.find((item) => item.id === targetId) : undefined
  if (target && !shown.some((item) => item.id === target.id)) shown.push(target)
  return {
    items: shown,
    shown: shown.length,
    total: items.length,
    remaining: items.length - shown.length,
    showMore: () => setWindow({ key: viewKey, count: count + pageSize }),
  }
}
