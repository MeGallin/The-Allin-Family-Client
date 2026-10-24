import { useState, type ReactNode } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Link, RouterProvider, createMemoryRouter, useLocation } from 'react-router'
import { Provider } from 'react-redux'
import { afterEach, describe, expect, it } from 'vitest'
import { createAppStore } from '../../app/store'
import { clearPrivateState } from '../../app/session-actions'
import { LegacyWidgetRedirect } from '../../components/widgets/LegacyWidgetRedirect'
import { useLiveQueryOptions } from '../../hooks/useLiveQueryOptions'
import { testUser } from '../../test/fixtures'
import { userReceived } from '../auth/auth-slice'
import { DraftProtectionProvider, useDraftGuard } from '../drafts/DraftProtection'
import { removalScheduled } from '../removals/removals-slice'

let store: ReturnType<typeof createAppStore> | undefined
afterEach(() => {
  if (store) act(() => clearPrivateState(store!.dispatch))
  store = undefined
})
function mount(element: ReactNode, entry: string) {
  const router = createMemoryRouter([{ path: '*', element }], { initialEntries: [entry] })
  render(<RouterProvider router={router} />)
  return router
}
function LegacyDestination() {
  const { pathname } = useLocation()
  if (pathname === '/lists') return <LegacyWidgetRedirect tool="shopping" />
  if (pathname === '/polls') return <LegacyWidgetRedirect tool="polls" />
  return <p>Family widget destination</p>
}
function DraftForm() {
  const [draft, setDraft] = useState('')
  useDraftGuard(!!draft)
  return (
    <input
      aria-label="Draft text"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
    />
  )
}
function DraftWorkbench() {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  return (
    <>
      <Link to="/my-space?view=family&tool=polls">Open polls</Link>
      <Link to="/my-space?view=family&widget=17">Open spinner</Link>
      <DraftForm key={params.get('tool') ?? params.get('widget')} />
    </>
  )
}
function ReadPolicy() {
  const shopping = useLiveQueryOptions('/lists')
  const polls = useLiveQueryOptions('/polls')
  return <output data-testid="policy">{JSON.stringify({ shopping, polls })}</output>
}
const policy = () =>
  JSON.parse(screen.getByTestId('policy').textContent!) as {
    shopping: { skip: boolean; pollingInterval: number }
    polls: { skip: boolean; pollingInterval: number }
  }

describe('built-in family widget route boundaries', () => {
  it.each([
    ['/lists?q=Milk&sort=name&show=needed&marker=keep#item-7', 'shopping'],
    ['/polls?show=closed&edit=11&q=Dinner&marker=keep#poll-11', 'polls'],
  ])('redirects saved %s without losing filters, editor or exact target', async (entry, tool) => {
    const router = mount(<LegacyDestination />, entry)
    await screen.findByText('Family widget destination')
    const original = new URL(entry, 'http://localhost')
    const params = new URLSearchParams(router.state.location.search)
    expect(router.state.location.pathname).toBe('/my-space')
    expect(router.state.location.hash).toBe(original.hash)
    for (const [key, value] of original.searchParams) expect(params.get(key)).toBe(value)
    expect(params.get('view')).toBe('family')
    expect(params.get('tool')).toBe(tool)
    expect(router.state.historyAction).toBe('REPLACE')
    expect(fetch).not.toHaveBeenCalled()
  })

  it.each(['Open polls', 'Open spinner'])(
    'protects a mounted draft when navigating within Widgets: %s',
    async (destination) => {
      const router = mount(
        <DraftProtectionProvider>
          <DraftWorkbench />
        </DraftProtectionProvider>,
        '/my-space?view=family&tool=shopping',
      )
      fireEvent.change(screen.getByRole('textbox', { name: 'Draft text' }), {
        target: { value: 'Keep this unsaved item' },
      })
      fireEvent.click(screen.getByRole('link', { name: destination }))
      await screen.findByRole('dialog', { name: 'Discard unsaved changes?' })
      expect(new URLSearchParams(router.state.location.search).get('tool')).toBe('shopping')
      fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }))
      expect((screen.getByRole('textbox', { name: 'Draft text' }) as HTMLInputElement).value).toBe(
        'Keep this unsaved item',
      )
      fireEvent.click(screen.getByRole('link', { name: destination }))
      await screen.findByRole('dialog', { name: 'Discard unsaved changes?' })
      fireEvent.click(screen.getByRole('button', { name: 'Discard changes' }))
      await waitFor(() =>
        expect(new URLSearchParams(router.state.location.search).get('tool')).not.toBe('shopping'),
      )
      expect((screen.getByRole('textbox', { name: 'Draft text' }) as HTMLInputElement).value).toBe(
        '',
      )
      expect(fetch).not.toHaveBeenCalled()
    },
  )

  it('subscribes only the selected tool and retains a queued removal safety read after switching', async () => {
    store = createAppStore()
    store.dispatch(userReceived(testUser))
    const router = mount(
      <Provider store={store}>
        <ReadPolicy />
      </Provider>,
      '/my-space?view=family&tool=shopping',
    )
    expect(policy().shopping).toMatchObject({ skip: false, pollingInterval: 15_000 })
    expect(policy().polls).toMatchObject({ skip: true, pollingInterval: 0 })
    await act(async () => {
      await router.navigate('/my-space?view=family&tool=polls')
    })
    expect(policy().shopping.skip).toBe(true)
    expect(policy().polls).toMatchObject({ skip: false, pollingInterval: 15_000 })
    act(() => {
      store!.dispatch(
        removalScheduled({
          key: 'shopping:7',
          domain: 'shopping',
          item: { id: '7', title: 'Isolated pending item', version: 1 },
          token: 'isolated-removal',
          ownerId: testUser.id,
          generation: store!.getState().auth.generation,
          sending: false,
          deadline: Date.now() + 20_000,
        }),
      )
    })
    expect(policy().shopping.skip).toBe(false)
    expect(fetch).not.toHaveBeenCalled()
  })
})
