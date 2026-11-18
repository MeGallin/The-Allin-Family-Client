import { afterEach, expect, it, vi } from 'vitest'
import { getAdvertImage, getAdvertSnapshot, mutateAdvertising } from './advertising-api'
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})
function stalled() {
  vi.stubGlobal(
    'fetch',
    vi.fn(
      (_url, options: RequestInit) =>
        new Promise((_resolve, reject) => {
          options.signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          )
        }),
    ),
  )
}
it('bounds a stalled read and clears its timeout', async () => {
  vi.useFakeTimers()
  stalled()
  const pending = getAdvertSnapshot()
  const check = expect(pending).rejects.toMatchObject({ code: 'request_timeout' })
  await vi.advanceTimersByTimeAsync(15000)
  await check
  expect(vi.getTimerCount()).toBe(0)
})
it('allows a longer finite prepare deadline with uncertain-save feedback', async () => {
  vi.useFakeTimers()
  stalled()
  const pending = mutateAdvertising({ action: 'prepare', version: 1 })
  const check = expect(pending).rejects.toMatchObject({
    code: 'request_timeout',
    message: expect.stringContaining('may have saved'),
  })
  await vi.advanceTimersByTimeAsync(375000)
  await check
  expect(vi.getTimerCount()).toBe(0)
})
it('preserves caller cancellation rather than calling it a timeout', async () => {
  stalled()
  const abort = new AbortController()
  const pending = getAdvertSnapshot(abort.signal)
  const check = expect(pending).rejects.toMatchObject({ name: 'AbortError' })
  abort.abort()
  await check
})

it('retrieves only opaque same-origin JPEGs through the shared authenticated boundary', async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValue(new Response('jpeg', { headers: { 'Content-Type': 'image/jpeg' } }))
  vi.stubGlobal('fetch', fetcher)
  const blob = await getAdvertImage('a'.repeat(48))
  expect(blob.type).toBe('image/jpeg')
  expect(fetcher).toHaveBeenCalledWith(
    '/api/advertising/image?id=' + 'a'.repeat(48),
    expect.objectContaining({
      credentials: 'same-origin',
      cache: 'no-store',
      signal: expect.any(AbortSignal),
    }),
  )
  await expect(getAdvertImage('https://example.com/image.jpg')).rejects.toMatchObject({
    code: 'invalid_image',
  })
  expect(fetcher).toHaveBeenCalledTimes(1)
})
it('rejects unexpected image types and preserves auth errors', async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(new Response('<svg/>', { headers: { 'Content-Type': 'image/svg+xml' } }))
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Sign in', code: 'unauthenticated' }), { status: 401 }),
    )
  vi.stubGlobal('fetch', fetcher)
  await expect(getAdvertImage('a'.repeat(48))).rejects.toMatchObject({ code: 'invalid_image' })
  await expect(getAdvertImage('a'.repeat(48))).rejects.toMatchObject({
    status: 401,
    code: 'unauthenticated',
  })
})
it('bounds and cancels private image reads', async () => {
  vi.useFakeTimers()
  stalled()
  const pending = getAdvertImage('a'.repeat(48))
  const check = expect(pending).rejects.toMatchObject({ code: 'request_timeout' })
  await vi.advanceTimersByTimeAsync(15000)
  await check
  const abort = new AbortController()
  const cancelled = getAdvertImage('a'.repeat(48), abort.signal)
  const cancelledCheck = expect(cancelled).rejects.toMatchObject({ name: 'AbortError' })
  abort.abort()
  await cancelledCheck
})
