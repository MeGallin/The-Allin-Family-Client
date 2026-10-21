export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// The session cookie is HttpOnly. Only the CSRF token is held in client memory.
let csrfToken = ''

export function setCsrfToken(token: string) {
  csrfToken = token
}

export function apiUrl(path: string) {
  const base = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')
  return base + path
}

export async function request<T>(
  path: string,
  body?: object | FormData,
  signal?: AbortSignal,
): Promise<T> {
  const multipart = body instanceof FormData
  let response: Response
  try {
    response = await fetch(apiUrl(path), {
      method: body ? 'POST' : 'GET',
      signal,
      credentials: 'same-origin',
      cache: 'no-store',
      headers: body
        ? {
            ...(!multipart ? { 'Content-Type': 'application/json' } : {}),
            'X-CSRF-Token': csrfToken,
            Accept: 'application/json',
          }
        : { Accept: 'application/json' },
      body: multipart ? body : body ? JSON.stringify(body) : undefined,
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error
    throw new ApiError('Unable to connect. Please try again.', 0, 'network_error')
  }
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new ApiError(
      data?.error || 'The service is unavailable. Please try again.',
      response.status,
      data?.code || '',
    )
  }
  if (!data) throw new ApiError('The service returned an unexpected response.', 502, '')
  return data as T
}
