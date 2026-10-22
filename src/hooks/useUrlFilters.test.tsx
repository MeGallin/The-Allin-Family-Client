import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
const routing = vi.hoisted(() => ({
  location: { pathname: '/lists', search: '', hash: '', key: 'initial', state: null },
  navigate: vi.fn(),
}))
vi.mock('react-router', () => ({
  useLocation: () => routing.location,
  useNavigate: () => routing.navigate,
}))
import { useUrlFilters } from './useUrlFilters'
describe('interleaved router commits', () => {
  it('retains newer changes when an older location commits between user selections', () => {
    const { result, rerender } = renderHook(() => useUrlFilters())
    act(() => {
      result.current.update({ q: 'Dad' })
      result.current.update({ sort: 'name' })
    })
    routing.location = { ...routing.location, search: '?q=Dad', key: 'earlier' }
    rerender()
    act(() => result.current.update({ show: 'important' }))
    expect(routing.navigate.mock.calls.at(-1)?.[0].search).toBe('?q=Dad&sort=name&show=important')
    routing.location = {
      ...routing.location,
      search: '?q=Dad&sort=name&show=important',
      key: 'final',
    }
    rerender()
    routing.location = { ...routing.location, search: '?q=Back', key: 'back' }
    rerender()
    act(() => result.current.update({ sort: 'oldest' }))
    expect(routing.navigate.mock.calls.at(-1)?.[0].search).toBe('?q=Back&sort=oldest')
  })
})
