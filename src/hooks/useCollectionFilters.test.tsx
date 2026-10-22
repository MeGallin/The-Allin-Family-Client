import { act, fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { useCollectionFilters } from './useCollectionFilters'
import { useAdminFilters } from '../features/admin/useAdminFilters'
import { shoppingSort, shoppingFilter } from '../features/shopping/shopping-view'
import { noteSort } from '../features/notes/notes-view'
function Collection({ privacy = false }: { privacy?: boolean }) {
  const filters = useCollectionFilters({
    sort: privacy ? noteSort : shoppingSort,
    filter: shoppingFilter,
    storage: privacy ? 'memory' : 'url',
  })
  return (
    <>
      <output data-testid="state">
        {JSON.stringify({ query: filters.query, sort: filters.sort, filter: filters.filter })}
      </output>
      <button
        onClick={() => {
          filters.setQuery('Dad')
          filters.setSort('name')
          filters.setFilter('important')
        }}
      >
        Rapid changes
      </button>
      <button onClick={filters.reset}>Reset</button>
      <button onClick={() => filters.setQuery('x'.repeat(150))}>Long query</button>
    </>
  )
}
function mount(element: React.ReactNode, entries: string[], index = entries.length - 1) {
  const router = createMemoryRouter([{ path: '*', element }], {
    initialEntries: entries,
    initialIndex: index,
  })
  const view = render(<RouterProvider router={router} />)
  return { router, ...view }
}
const state = () => JSON.parse(screen.getByTestId('state').textContent!)
describe('shared collection filter state', () => {
  it('merges rapid selections and preserves editor/unrelated parameters; reset clears only its own fields', async () => {
    const { router } = mount(<Collection />, ['/lists?compose=item&marker=keep#old'])
    fireEvent.click(screen.getByText('Rapid changes'))
    await act(async () => {})
    expect(state()).toEqual({ query: 'Dad', sort: 'name', filter: 'important' })
    const params = new URLSearchParams(router.state.location.search)
    expect(params.get('compose')).toBe('item')
    expect(params.get('marker')).toBe('keep')
    expect(router.state.location.hash).toBe('')
    expect(router.state.historyAction).toBe('REPLACE')
    fireEvent.click(screen.getByText('Reset'))
    await act(async () => {})
    expect(router.state.location.search).toBe('?compose=item&marker=keep')
    expect(state()).toEqual({ query: '', sort: 'priority', filter: 'all' })
  })
  it('restores browser Back/Forward state and validates invalid options and oversized URL queries', async () => {
    const { router } = mount(<Collection />, [
      '/lists?q=First&sort=oldest',
      '/lists?q=Second&show=needed',
    ])
    expect(state().query).toBe('Second')
    await act(async () => {
      await router.navigate(-1)
    })
    expect(state()).toEqual({ query: 'First', sort: 'oldest', filter: 'all' })
    fireEvent.click(screen.getByText('Rapid changes'))
    await act(async () => {})
    expect(state().filter).toBe('important')
    await act(async () => {
      await router.navigate(1)
    })
    expect(state()).toEqual({ query: 'Second', sort: 'priority', filter: 'needed' })
    await act(async () => {
      await router.navigate('/lists?q=' + 'a'.repeat(150) + '&sort=bogus&show=bogus')
    })
    expect(state().query).toHaveLength(100)
    expect(state().sort).toBe('priority')
    expect(state().filter).toBe('all')
    fireEvent.click(screen.getByText('Long query'))
    await act(async () => {})
    expect(new URLSearchParams(router.state.location.search).get('q')).toHaveLength(100)
  })
  it('keeps private note filters out of URLs and storage, and resets them in memory', async () => {
    const writes = vi.spyOn(Storage.prototype, 'setItem')
    const { router } = mount(<Collection privacy />, ['/notes?compose=note&marker=keep#note-2'])
    fireEvent.click(screen.getByText('Rapid changes'))
    await act(async () => {})
    expect(state().query).toBe('Dad')
    expect(state().sort).toBe('name')
    expect(router.state.location.search).toBe('?compose=note&marker=keep')
    expect(router.state.location.hash).toBe('#note-2')
    expect(writes).not.toHaveBeenCalled()
    fireEvent.click(screen.getByText('Reset'))
    expect(state().query).toBe('')
    expect(state().sort).toBe('updated')
  })
  it('preserves admin history and clears stale pagination on rapid filter changes', async () => {
    function Admin() {
      const { params, days, setFilter } = useAdminFilters(true)
      return (
        <>
          <output data-testid="admin">{days + ':' + params.get('actor')}</output>
          <button
            onClick={() => {
              setFilter('days', '7')
              setFilter('actor', '101')
            }}
          >
            Admin changes
          </button>
        </>
      )
    }
    const { router } = mount(<Admin />, ['/admin?view=activity&days=30&before=99&marker=keep'])
    fireEvent.click(screen.getByText('Admin changes'))
    await act(async () => {})
    expect(screen.getByTestId('admin').textContent).toBe('7:101')
    const params = new URLSearchParams(router.state.location.search)
    expect(params.has('before')).toBe(false)
    expect(params.get('view')).toBe('activity')
    expect(params.get('marker')).toBe('keep')
    expect(router.state.historyAction).toBe('PUSH')
    await act(async () => {
      await router.navigate(-1)
    })
    expect(screen.getByTestId('admin').textContent).toBe('7:null')
  })
})
