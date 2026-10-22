import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { createAppStore } from '../../app/store'
import { clearPrivateState } from '../../app/session-actions'
import { userReceived } from '../auth/auth-slice'
import { useRemovals } from './useRemovals'
import { removalAdapters } from './removal-adapters'
import { PendingRemovals } from '../../components/removals/PendingRemovals'
import {
  removalScheduled,
  removalUndone,
  REMOVAL_DELAY_MS,
  type RemovalDomain,
} from './removals-slice'
import { testUser, jsonResponse, deferred } from '../../test/fixtures'
let store: ReturnType<typeof createAppStore>
let fetchMock: ReturnType<typeof vi.fn>
const item = { id: '7', title: 'Disposable item', version: 1 }
function queue(domain: RemovalDomain = 'shopping', token = 'test-token') {
  const entry = {
    key: domain + ':7',
    domain,
    item,
    token,
    ownerId: testUser.id,
    generation: store.getState().auth.generation,
    sending: false,
    deadline: Date.now() + REMOVAL_DELAY_MS,
  }
  store.dispatch(removalScheduled(entry))
  return entry
}
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-22T12:00:00Z'))
  store = createAppStore()
  store.dispatch(userReceived(testUser))
  fetchMock = vi.fn(async () =>
    jsonResponse({
      items: [],
      events: [],
      memories: [],
      polls: [],
      notes: [],
      activity: [],
      ownerId: testUser.id,
    }),
  )
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => {
  clearPrivateState(store.dispatch)
})
describe('shared 20-second delayed removal', () => {
  it.each<RemovalDomain>(['shopping', 'calendar', 'memories', 'notes', 'polls'])(
    'sends %s removal only after 20 seconds',
    async (domain) => {
      expect(REMOVAL_DELAY_MS).toBe(20_000)
      queue(domain)
      await vi.advanceTimersByTimeAsync(19_999)
      expect(fetchMock).not.toHaveBeenCalled()
      await vi.advanceTimersByTimeAsync(1)
      expect(fetchMock).toHaveBeenCalledOnce()
      expect(fetchMock.mock.calls[0][0]).toBe('/api/' + domain + '/remove')
      expect(store.getState().removals.entries).toEqual({})
    },
  )
  it('Undo at the last moment prevents the request permanently', async () => {
    const entry = queue()
    await vi.advanceTimersByTimeAsync(19_999)
    store.dispatch(removalUndone(entry.key))
    await vi.advanceTimersByTimeAsync(60_000)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(store.getState().removals.entries).toEqual({})
  })
  it('ignores duplicate scheduling and removes once', async () => {
    queue()
    queue('shopping', 'duplicate-token')
    await vi.advanceTimersByTimeAsync(20_000)
    expect(fetchMock).toHaveBeenCalledOnce()
  })
  it('cancels when sign-out clears the private state', async () => {
    queue()
    clearPrivateState(store.dispatch)
    await vi.advanceTimersByTimeAsync(20_000)
    expect(fetchMock).not.toHaveBeenCalled()
  })
  it('cancels after account switching, even when the record ID is the same', async () => {
    queue()
    store.dispatch(userReceived({ ...testUser, id: 202 }))
    await vi.advanceTimersByTimeAsync(20_000)
    expect(fetchMock).not.toHaveBeenCalled()
  })
  it.each([{ latest: [] }, { latest: [{ ...item, version: 2 }] }])(
    'does not delete removed or concurrently edited records',
    async ({ latest }) => {
      vi.spyOn(removalAdapters.shopping, 'latest').mockReturnValue(latest)
      queue()
      await vi.advanceTimersByTimeAsync(20_000)
      expect(fetchMock).not.toHaveBeenCalled()
      expect(store.getState().removals.feedback).toContain('content changed')
    },
  )
  it('waits for a busy save, then checks the latest version again', async () => {
    const busy = vi.spyOn(removalAdapters.shopping, 'busy').mockReturnValue(true)
    const latest = vi.spyOn(removalAdapters.shopping, 'latest').mockReturnValue([item])
    queue()
    await vi.advanceTimersByTimeAsync(20_000)
    expect(fetchMock).not.toHaveBeenCalled()
    latest.mockReturnValue([{ ...item, version: 2 }])
    busy.mockReturnValue(false)
    await vi.advanceTimersByTimeAsync(100)
    expect(fetchMock).not.toHaveBeenCalled()
  })
  it('does not offer Undo once the HTTP removal has started', async () => {
    const waiting = deferred<Response>()
    fetchMock.mockReturnValue(waiting.promise)
    const entry = queue()
    await vi.advanceTimersByTimeAsync(20_000)
    expect(store.getState().removals.entries[entry.key].sending).toBe(true)
    store.dispatch(removalUndone(entry.key))
    expect(store.getState().removals.entries[entry.key]).toBeDefined()
    waiting.resolve(jsonResponse({ items: [], activity: [] }))
    await vi.advanceTimersByTimeAsync(1)
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(store.getState().removals.entries).toEqual({})
  })
  it('reports a failed removal without silently retrying it', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: 'Save failed' }, 503))
    queue()
    await vi.advanceTimersByTimeAsync(20_000)
    expect(store.getState().removals.entries).toEqual({})
    expect(store.getState().removals.feedback).toContain('could not be completed')
    await vi.advanceTimersByTimeAsync(60_000)
    expect(fetchMock).toHaveBeenCalledOnce()
  })
  it('keeps independently scheduled features on their own deadlines', async () => {
    queue('shopping')
    await vi.advanceTimersByTimeAsync(10_000)
    queue('calendar')
    await vi.advanceTimersByTimeAsync(9_999)
    expect(fetchMock).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(fetchMock).toHaveBeenCalledOnce()
    await vi.advanceTimersByTimeAsync(9_999)
    expect(fetchMock).toHaveBeenCalledOnce()
    await vi.advanceTimersByTimeAsync(1)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
  it('shows accessible 20-second UI and Undo; queued notes never contain body text', async () => {
    function AddRemoval() {
      const removal = useRemovals('notes')
      return (
        <button onClick={() => removal.remove({ ...item, body: 'Secret writing' } as typeof item)}>
          Delete fixture
        </button>
      )
    }
    render(
      <Provider store={store}>
        <AddRemoval />
        <PendingRemovals />
        <main id="family-content" tabIndex={-1} />
      </Provider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Delete fixture' }))
    expect(screen.getByText('Removing in 20 seconds')).toBeTruthy()
    expect(screen.getByRole('progressbar').getAttribute('max')).toBe('20')
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Undo removal of Disposable item' }),
    )
    expect(Object.keys(store.getState().removals.entries['notes:7'].item)).toEqual([
      'id',
      'title',
      'version',
    ])
    await act(() => vi.advanceTimersByTimeAsync(19_000))
    fireEvent.click(screen.getByRole('button', { name: 'Undo removal of Disposable item' }))
    await act(() => vi.advanceTimersByTimeAsync(30_000))
    expect(fetchMock).not.toHaveBeenCalled()
    expect(screen.getByText('Removal cancelled. Your content has been kept.')).toBeTruthy()
  })
})
