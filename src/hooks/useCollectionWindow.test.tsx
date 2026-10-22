import { renderHook, act } from '@testing-library/react'
import { expect, it } from 'vitest'
import { useCollectionWindow } from './useCollectionWindow'
it('resets expanded windows when filters change and when returning to an earlier filter', () => {
  const items = Array.from({ length: 65 }, (_, i) => ({ id: String(i) }))
  const { result, rerender } = renderHook(
    ({ viewKey }) => useCollectionWindow(items, { viewKey, pageSize: 30 }),
    { initialProps: { viewKey: 'priority' } },
  )
  act(() => result.current.showMore())
  expect(result.current.shown).toBe(60)
  rerender({ viewKey: 'alphabetical' })
  expect(result.current.shown).toBe(30)
  rerender({ viewKey: 'priority' })
  expect(result.current.shown).toBe(30)
})
it('reveals an older deep-link target without rendering the whole collection', () => {
  const items = Array.from({ length: 100 }, (_, i) => ({ id: String(i) }))
  const { result } = renderHook(() => useCollectionWindow(items, { targetId: '99' }))
  expect(result.current.items).toHaveLength(21)
  expect(result.current.items.at(-1)?.id).toBe('99')
})
