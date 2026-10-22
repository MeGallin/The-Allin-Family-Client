import { describe, it, expect, vi } from 'vitest'
import { createAppStore } from './store'
import { executeWrite } from './execute-write'
import { userReceived } from '../features/auth/auth-slice'
import { testUser, deferred } from '../test/fixtures'
import { ApiError } from '../services/api-client'
function scenario() {
  const store = createAppStore()
  store.dispatch(userReceived(testUser))
  const plan = {
    busy: vi.fn(() => false),
    start: vi.fn(),
    request: vi.fn(async () => 'saved'),
    commit: vi.fn(async (_data: string) => {}),
    refresh: vi.fn(async () => {}),
    finish: vi.fn(),
    failed: vi.fn(),
  }
  return { store, plan, run: () => executeWrite(store.dispatch, store.getState, plan) }
}
describe('shared saving lifecycle', () => {
  it('commits a successful save once and releases busy state', async () => {
    const { plan, run } = scenario()
    expect(await run()).toBe(true)
    expect(plan.start).toHaveBeenCalledOnce()
    expect(plan.commit).toHaveBeenCalledExactlyOnceWith('saved')
    expect(plan.finish).toHaveBeenCalledOnce()
    expect(plan.failed).not.toHaveBeenCalled()
  })
  it('does not write while another operation is busy', async () => {
    const { plan, run } = scenario()
    plan.busy.mockReturnValue(true)
    expect(await run()).toBe(false)
    expect(plan.request).not.toHaveBeenCalled()
  })
  it('does not write without a session', async () => {
    const { store, plan, run } = scenario()
    store.dispatch(userReceived(null))
    expect(await run()).toBe(false)
    expect(plan.start).not.toHaveBeenCalled()
  })
  it.each([404, 409])('refreshes on %i without committing stale content', async (status) => {
    const { plan, run } = scenario()
    plan.request.mockRejectedValue(new ApiError('Conflict', status, 'conflict'))
    expect(await run()).toBe(false)
    expect(plan.commit).not.toHaveBeenCalled()
    expect(plan.refresh).toHaveBeenCalledOnce()
    expect(plan.failed).toHaveBeenCalledWith({ message: 'Conflict', status, code: 'conflict' })
    expect(plan.finish).toHaveBeenCalledOnce()
  })
  it('reports a permissions rejection without retrying the write', async () => {
    const { plan, run } = scenario()
    plan.request.mockRejectedValue(new ApiError('Denied', 403, 'forbidden'))
    expect(await run()).toBe(false)
    expect(plan.refresh).not.toHaveBeenCalled()
    expect(plan.finish).toHaveBeenCalledOnce()
  })
  it('ignores an old account response after sign-out/account switching', async () => {
    const { store, plan, run } = scenario()
    const waiting = deferred<string>()
    plan.request.mockReturnValue(waiting.promise)
    const saving = run()
    store.dispatch(userReceived({ ...testUser, id: 202 }))
    waiting.resolve('private old result')
    expect(await saving).toBe(false)
    expect(plan.commit).not.toHaveBeenCalled()
    expect(plan.finish).not.toHaveBeenCalled()
  })
})
