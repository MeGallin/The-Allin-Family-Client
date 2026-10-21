import { ApiError, request } from './api-client'
import { getSession } from './auth-api'
/** Shared transport for JSON and photo writes; retry an expired CSRF token once. */
export async function writeRequest<T>(
  path: string,
  body: object | FormData,
  signal?: AbortSignal,
): Promise<T> {
  try {
    return await request<T>(path, body, signal)
  } catch (error) {
    if (!(error instanceof ApiError) || error.code !== 'csrf_failed' || signal?.aborted) throw error
    await getSession(signal)
    return request<T>(path, body, signal)
  }
}
