import { afterEach, describe, expect, it, vi } from 'vitest'
import { createAppStore } from '../../app/store'
import { clearPrivateState } from '../../app/session-actions'
import { userReceived } from '../auth/auth-slice'
import { focusTimerApi } from '../../services/focus-timer-query'
import { executeFocusTimerWrite } from './focus-timer-actions'
import { focusSnapshot, focusReceipt, focusSession } from '../../test/focus-timer-fixtures'
import { deferred, jsonResponse, testUser } from '../../test/fixtures'
import { removalScheduled, removalUndone } from '../removals/removals-slice'
const stores: ReturnType<typeof createAppStore>[] = []
function setup() {
  const s = createAppStore()
  stores.push(s)
  s.dispatch(userReceived(testUser))
  return s
}
afterEach(() => stores.splice(0).forEach((s) => clearPrivateState(s.dispatch)))
describe('Focus Timer actual Redux/cache/receipt/removal lifecycle', () => {
  it('rejects another owner and clears current/history on session reset', async () => {
    const s = setup()
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(focusSnapshot({ ownerId: 202 }))),
    )
    const result = await s.dispatch(focusTimerApi.endpoints.getFocusTimer.initiate(testUser.id))
    expect(result.error).toMatchObject({ status: 401, code: 'account_changed' })
    expect(result.data).toBeUndefined()
    await s.dispatch(
      focusTimerApi.util.upsertQueryData(
        'getFocusTimer',
        testUser.id,
        focusSnapshot({ session: focusSession() }),
      ),
    )
    clearPrivateState(s.dispatch)
    expect(
      focusTimerApi.endpoints.getFocusTimer.select(testUser.id)(s.getState()).data,
    ).toBeUndefined()
  })
  it('acknowledges an old immutable receipt but displays the newer authoritative timer', async () => {
    const s = setup(),
      old = focusSnapshot({ version: 2, session: focusSession() }),
      latest = focusSnapshot({
        version: 9,
        session: focusSession({ id: '509', phase: 'short', durationMs: 60000 }),
      })
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async (_, init) =>
        jsonResponse(init?.method === 'POST' ? focusReceipt(old) : latest),
      ),
    )
    const result = await s.dispatch(
      executeFocusTimerWrite({ action: 'pause', body: { requestKey: 'old' } }),
    )
    expect(result.receipt?.version).toBe(2)
    expect(focusTimerApi.endpoints.getFocusTimer.select(testUser.id)(s.getState()).data).toEqual(
      latest,
    )
    expect(s.getState().focusTimerUi.busy).toBe(false)
  })
  it('returns definitive conflict and refreshes without replaying the rejected transition', async () => {
    const s = setup()
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async (_, init) =>
        init?.method === 'POST'
          ? jsonResponse({ error: 'Changed', code: 'focus_conflict' }, 409)
          : jsonResponse(focusSnapshot({ version: 3 })),
      ),
    )
    expect(
      await s.dispatch(executeFocusTimerWrite({ action: 'finish', body: { version: 1 } })),
    ).toMatchObject({ receipt: null, failure: { status: 409, code: 'focus_conflict' } })
    expect(
      focusTimerApi.endpoints.getFocusTimer.select(testUser.id)(s.getState()).data?.version,
    ).toBe(3)
  })
  it('reports uncertain network failure, blocks simultaneous writes and ignores late receipts after signout', async () => {
    const s = setup()
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Network error')
      }),
    )
    expect(await s.dispatch(executeFocusTimerWrite({ action: 'pause', body: {} }))).toMatchObject({
      receipt: null,
      failure: { status: 0 },
    })
    const waiting = deferred<Response>(),
      fetcher = vi.fn(() => waiting.promise)
    vi.stubGlobal('fetch', fetcher)
    const pending = s.dispatch(executeFocusTimerWrite({ action: 'start', body: {} }))
    expect(s.getState().focusTimerUi.busy).toBe(true)
    expect(
      (await s.dispatch(executeFocusTimerWrite({ action: 'start', body: {} }))).receipt,
    ).toBeNull()
    expect(fetcher).toHaveBeenCalledOnce()
    clearPrivateState(s.dispatch)
    waiting.resolve(jsonResponse(focusReceipt()))
    expect((await pending).receipt).toBeNull()
    expect(s.getState().focusTimerUi.feedback).toBe('')
  })
  it('honours20second Undo and cancels stale captured version before the remove write', async () => {
    vi.useFakeTimers()
    const s = setup(),
      fetcher = vi.fn<typeof fetch>(async (_, init) =>
        jsonResponse(
          init?.method === 'POST'
            ? focusReceipt(focusSnapshot({ version: 3, generation: 2, installed: false }))
            : focusSnapshot({ version: 3, generation: 2, installed: false }),
        ),
      )
    vi.stubGlobal('fetch', fetcher)
    const cache = (version = 1) =>
      s.dispatch(
        focusTimerApi.util.upsertQueryData(
          'getFocusTimer',
          testUser.id,
          focusSnapshot({ version, session: focusSession() }),
        ),
      )
    await cache()
    const entry = {
      key: 'focusTimer:focus-timer',
      domain: 'focusTimer' as const,
      item: { id: 'focus-timer', title: 'Focus Timer', version: 1 },
      token: 'stable-remove',
      ownerId: testUser.id,
      generation: s.getState().auth.generation,
      deadline: Date.now() + 20000,
      sending: false,
    }
    s.dispatch(removalScheduled(entry))
    await vi.advanceTimersByTimeAsync(19999)
    expect(fetcher).not.toHaveBeenCalled()
    s.dispatch(removalUndone(entry.key))
    await vi.advanceTimersByTimeAsync(21000)
    expect(fetcher).not.toHaveBeenCalled()
    s.dispatch(removalScheduled({ ...entry, deadline: Date.now() + 20000 }))
    await cache(2)
    await vi.advanceTimersByTimeAsync(20000)
    expect(fetcher).not.toHaveBeenCalled()
    expect(s.getState().removals.feedback).toContain('changed')
    s.dispatch(
      removalScheduled({
        ...entry,
        item: { ...entry.item, version: 2 },
        deadline: Date.now() + 20000,
      }),
    )
    await vi.advanceTimersByTimeAsync(20000)
    const writes = fetcher.mock.calls.filter(([, init]) => init?.method === 'POST')
    expect(writes).toHaveLength(1)
    expect(JSON.parse(String(writes[0][1]?.body))).toEqual({
      version: 2,
      generation: 1,
      sessionId: '501',
      requestKey: 'stable-remove',
    })
    expect(s.getState().removals.entries).toEqual({})
  })
})
