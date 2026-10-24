import { afterEach, describe, expect, it, vi } from 'vitest'
import { createAppStore } from '../../app/store'
import { clearPrivateState } from '../../app/session-actions'
import { userReceived } from '../auth/auth-slice'
import { sudokuApi } from '../../services/sudoku-query'
import { executeSudokuWrite } from './sudoku-actions'
import { sudokuGame } from '../../test/sudoku-fixtures'
import { deferred, jsonResponse, testUser } from '../../test/fixtures'
import { removalScheduled, removalUndone } from '../removals/removals-slice'

const stores: ReturnType<typeof createAppStore>[] = []
function setup() {
  const store = createAppStore()
  stores.push(store)
  store.dispatch(userReceived(testUser))
  return store
}
const snapshot = (version = 1) => ({
  ownerId: testUser.id,
  installationVersion: version,
  game: { ...sudokuGame(), version },
})
afterEach(() => stores.splice(0).forEach((store) => clearPrivateState(store.dispatch)))

describe('Sudoku private cache, writes and delayed removal', () => {
  it('rejects a snapshot from another account', async () => {
    const store = setup()
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async () => jsonResponse({ ...snapshot(), ownerId: 202 })),
    )
    const result = await store.dispatch(sudokuApi.endpoints.getSudoku.initiate(testUser.id))
    expect(result.data).toBeUndefined()
    expect(result.error).toMatchObject({ status: 401, code: 'account_changed' })
  })
  it('commits a successful write and refreshes a conflict without replacing it with the rejected payload', async () => {
    const store = setup()
    const fetchMock = vi.fn<typeof fetch>(async () => jsonResponse(snapshot(2)))
    vi.stubGlobal('fetch', fetchMock)
    const subscription = store.dispatch(sudokuApi.endpoints.getSudoku.initiate(testUser.id))
    await subscription
    expect(
      await store.dispatch(
        executeSudokuWrite({
          action: 'restart',
          body: { id: 701, version: 1, requestKey: 'first' },
        }),
      ),
    ).toBe(true)
    expect(
      sudokuApi.endpoints.getSudoku.select(testUser.id)(store.getState()).data?.game?.version,
    ).toBe(2)
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ error: 'Changed', code: 'sudoku_conflict' }, 409))
      .mockResolvedValueOnce(jsonResponse(snapshot(3)))
    expect(
      await store.dispatch(
        executeSudokuWrite({
          action: 'restart',
          body: { id: 701, version: 2, requestKey: 'stale' },
        }),
      ),
    ).toBe(false)
    expect(
      sudokuApi.endpoints.getSudoku.select(testUser.id)(store.getState()).data?.game?.version,
    ).toBe(3)
    expect(store.getState().sudokuUi.busy).toBe(false)
  })
  it('clears cached progress and ignores a late write after sign-out', async () => {
    const store = setup(),
      waiting = deferred<Response>()
    await store.dispatch(sudokuApi.util.upsertQueryData('getSudoku', testUser.id, snapshot()))
    vi.stubGlobal(
      'fetch',
      vi.fn(() => waiting.promise),
    )
    const pending = store.dispatch(
      executeSudokuWrite({ action: 'restart', body: { id: 701, version: 1, requestKey: 'late' } }),
    )
    clearPrivateState(store.dispatch)
    waiting.resolve(jsonResponse(snapshot(2)))
    expect(await pending).toBe(false)
    expect(sudokuApi.endpoints.getSudoku.select(testUser.id)(store.getState()).data).toBeUndefined()
    expect(store.getState().sudokuUi.feedback).toBe('')
  })
  it('uses the shared 20-second Undo deadline and sends only revision metadata', async () => {
    vi.useFakeTimers()
    const store = setup(),
      fetchMock = vi.fn<typeof fetch>(async () =>
        jsonResponse({ ownerId: testUser.id, installationVersion: 2, game: null }),
      )
    vi.stubGlobal('fetch', fetchMock)
    await store.dispatch(sudokuApi.util.upsertQueryData('getSudoku', testUser.id, snapshot()))
    const entry = {
      key: 'sudoku:701',
      domain: 'sudoku' as const,
      item: { id: '701', version: 1, title: 'Sudoku' },
      token: 'stable-remove-key',
      ownerId: testUser.id,
      generation: store.getState().auth.generation,
      deadline: Date.now() + 20_000,
      sending: false,
    }
    store.dispatch(removalScheduled(entry))
    await vi.advanceTimersByTimeAsync(19_999)
    expect(fetchMock).not.toHaveBeenCalled()
    store.dispatch(removalUndone(entry.key))
    await vi.advanceTimersByTimeAsync(30_000)
    expect(fetchMock).not.toHaveBeenCalled()
    store.dispatch(removalScheduled({ ...entry, deadline: Date.now() + 20_000 }))
    await vi.advanceTimersByTimeAsync(20_000)
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(fetchMock.mock.calls[0][0]).toBe('/api/sudoku/remove')
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      id: '701',
      version: 1,
      requestKey: 'stable-remove-key',
    })
    expect(store.getState().removals.entries).toEqual({})
  })
})
