import { afterEach, describe, expect, it, vi } from 'vitest'
import { withRequestTimeout } from './request-timeout'
describe('Bounded request feedback', () => {
  afterEach(() => vi.useRealTimers())
  it('aborts a stalled request with an honest uncertain-save message', async () => {
    vi.useFakeTimers()
    const pending = withRequestTimeout(
      (signal) =>
        new Promise((_, reject) =>
          signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError'))),
        ),
      undefined,
      100,
    )
    const check = expect(pending).rejects.toMatchObject({
      code: 'request_timeout',
      message: expect.stringContaining('may have saved'),
    })
    await vi.advanceTimersByTimeAsync(100)
    await check
    expect(vi.getTimerCount()).toBe(0)
  })
  it('preserves caller cancellation instead of reporting a timeout', async () => {
    vi.useFakeTimers()
    const controller = new AbortController()
    const pending = withRequestTimeout(
      (signal) =>
        new Promise((_, reject) =>
          signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError'))),
        ),
      controller.signal,
      100,
    )
    const check = expect(pending).rejects.toMatchObject({ name: 'AbortError' })
    controller.abort()
    await check
    expect(vi.getTimerCount()).toBe(0)
  })
  it('clears timers after success and ordinary failure', async () => {
    vi.useFakeTimers()
    expect(await withRequestTimeout(async () => 42)).toBe(42)
    await expect(
      withRequestTimeout(async () => {
        throw new Error('offline')
      }),
    ).rejects.toThrow('offline')
    expect(vi.getTimerCount()).toBe(0)
  })
})
