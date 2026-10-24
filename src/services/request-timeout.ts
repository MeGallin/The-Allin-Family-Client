import { ApiError } from './api-client'
/** Bound stalled reads and writes while preserving the caller’s cancellation. */
export async function withRequestTimeout<T>(
  request: (signal: AbortSignal) => Promise<T>,
  signal?: AbortSignal,
  milliseconds = 15_000,
  timeoutMessage = 'This is taking longer than expected. It may have saved. Refresh to check, then retry if needed.',
): Promise<T> {
  if (signal?.aborted) throw new DOMException('Request cancelled', 'AbortError')
  const controller = new AbortController()
  let timedOut = false
  const cancel = () => controller.abort()
  signal?.addEventListener('abort', cancel, { once: true })
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, milliseconds)
  try {
    return await request(controller.signal)
  } catch (error) {
    if (timedOut) throw new ApiError(timeoutMessage, 0, 'request_timeout')
    throw error
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', cancel)
  }
}
