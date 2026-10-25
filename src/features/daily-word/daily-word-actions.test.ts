import { afterEach, describe, expect, it, vi } from 'vitest'
import { createAppStore } from '../../app/store'
import { clearPrivateState } from '../../app/session-actions'
import { userReceived } from '../auth/auth-slice'
import { dailyWordApi } from '../../services/daily-word-query'
import { executeDailyWordWrite } from './daily-word-actions'
import { deferred, jsonResponse, testUser } from '../../test/fixtures'
import { wordSnapshot, wordReceipt } from '../../test/daily-word-fixtures'
import { removalScheduled, removalUndone } from '../removals/removals-slice'
const stores: ReturnType<typeof createAppStore>[] = []
const setup = () => {
  const store = createAppStore()
  stores.push(store)
  store.dispatch(userReceived(testUser))
  return store
}
afterEach(() => stores.splice(0).forEach((s) => clearPrivateState(s.dispatch)))
describe('Daily Word actual Redux/cache/write/removal lifecycle', () => {
  it('rejects another owner snapshot and clears all cached private state on account change', async () => {
    const store = setup()
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(wordSnapshot({ ownerId: 202 }))),
    )
    const result = await store.dispatch(dailyWordApi.endpoints.getDailyWord.initiate(testUser.id))
    expect(result.data).toBeUndefined()
    expect(result.error).toMatchObject({ status: 401, code: 'account_changed' })
    await store.dispatch(
      dailyWordApi.util.upsertQueryData('getDailyWord', testUser.id, wordSnapshot()),
    )
    clearPrivateState(store.dispatch)
    expect(
      dailyWordApi.endpoints.getDailyWord.select(testUser.id)(store.getState()).data,
    ).toBeUndefined()
  })
  it('acknowledges immutable old receipts without overwriting a newer authoritative board', async () => {
    const store = setup(),
      old = wordSnapshot(),
      latest = wordSnapshot({
        progress: {
          ...old.progress,
          revision: 2,
          guesses: [
            { word: 'crane', marks: ['absent', 'absent', 'correct', 'absent', 'correct'] },
            { word: 'slate', marks: ['absent', 'present', 'correct', 'absent', 'correct'] },
          ],
        },
      })
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async (_, init) =>
        jsonResponse(init?.method === 'POST' ? wordReceipt(old) : latest),
      ),
    )
    const result = await store.dispatch(
      executeDailyWordWrite({ action: 'guess', body: { requestKey: 'historical' } }),
    )
    expect(result.receipt?.progress?.revision).toBe(0)
    expect(
      dailyWordApi.endpoints.getDailyWord.select(testUser.id)(store.getState()).data?.progress
        .revision,
    ).toBe(2)
    expect(store.getState().dailyWordUi.busy).toBe(false)
  })
  it('returns definitive rejection status and refreshes a conflict rather than committing a guess', async () => {
    const store = setup(),
      latest = wordSnapshot({ installationVersion: 3 })
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async (_, init) =>
        init?.method === 'POST'
          ? jsonResponse({ error: 'Changed', code: 'word_conflict' }, 409)
          : jsonResponse(latest),
      ),
    )
    const result = await store.dispatch(
      executeDailyWordWrite({ action: 'guess', body: { guess: 'crane' } }),
    )
    expect(result).toMatchObject({ receipt: null, failure: { status: 409, code: 'word_conflict' } })
    expect(dailyWordApi.endpoints.getDailyWord.select(testUser.id)(store.getState()).data).toEqual(
      latest,
    )
  })
  it('reports an uncertain network failure and ignores a late receipt after session change', async () => {
    const store = setup()
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Network unavailable')
      }),
    )
    expect(
      await store.dispatch(executeDailyWordWrite({ action: 'guess', body: { guess: 'crane' } })),
    ).toMatchObject({ receipt: null, failure: { status: 0 } })
    const waiting = deferred<Response>()
    vi.stubGlobal(
      'fetch',
      vi.fn(() => waiting.promise),
    )
    const pending = store.dispatch(
      executeDailyWordWrite({ action: 'guess', body: { guess: 'crane' } }),
    )
    clearPrivateState(store.dispatch)
    waiting.resolve(jsonResponse(wordReceipt()))
    expect((await pending).receipt).toBeNull()
    expect(store.getState().dailyWordUi.feedback).toBe('')
    expect(
      dailyWordApi.endpoints.getDailyWord.select(testUser.id)(store.getState()).data,
    ).toBeUndefined()
  })
  it('uses the shared 20-second Undo deadline and a generation-only removal payload', async () => {
    vi.useFakeTimers()
    const store = setup(),
      fetchMock = vi.fn<typeof fetch>(async (_, init) =>
        jsonResponse(
          init?.method === 'POST'
            ? wordReceipt(wordSnapshot({ installed: false, installationVersion: 2 }))
            : wordSnapshot({ installed: false, installationVersion: 2 }),
        ),
      )
    vi.stubGlobal('fetch', fetchMock)
    await store.dispatch(
      dailyWordApi.util.upsertQueryData('getDailyWord', testUser.id, wordSnapshot()),
    )
    const entry = {
      key: 'dailyWord:daily-word',
      domain: 'dailyWord' as const,
      item: { id: 'daily-word', title: 'Daily Word', version: 1 },
      token: 'stable-remove',
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
    const writes = fetchMock.mock.calls.filter(([, init]) => init?.method === 'POST')
    expect(writes).toHaveLength(1)
    expect(writes[0][0]).toBe('/api/daily-word/remove')
    expect(JSON.parse(String(writes[0][1]?.body))).toEqual({
      version: 1,
      requestKey: 'stable-remove',
    })
    expect(store.getState().removals.entries).toEqual({})
  })
})
