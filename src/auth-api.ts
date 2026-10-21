export type FamilyUser = {
  id: number
  username: string
  displayName: string
  role: 'admin' | 'member'
  mustChangePassword: boolean
}
export type FamilySession = { user: FamilyUser | null; csrfToken: string }
export type FamilyHome = { message: string; user: FamilyUser }

export class ApiError extends Error {
  constructor(message: string, public status: number, public code: string) {
    super(message)
  }
}

// Session IDs remain in HttpOnly cookies. CSRF tokens live in memory only.
let csrfToken = ''

async function request<T>(path: string, body?: object, signal?: AbortSignal): Promise<T> {
  const base = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')
  let response: Response
  try {
    response = await fetch(`${base}${path}`, {
      method: body ? 'POST' : 'GET', signal,
      credentials: 'same-origin', cache: 'no-store',
      headers: body ? {
        'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken,
      } : { Accept: 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error
    throw new ApiError('Unable to connect. Please try again.', 0, 'network_error')
  }
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new ApiError(data?.error || 'The service is unavailable. Please try again.', response.status, data?.code || '')
  }
  if (!data) throw new ApiError('The service returned an unexpected response.', 502, '')
  return data as T
}

function rememberSession(session: FamilySession): FamilySession {
  csrfToken = session.csrfToken
  return session
}
export async function getSession(signal?: AbortSignal): Promise<FamilySession> {
  return rememberSession(await request<FamilySession>('/auth/session', undefined, signal))
}
export async function signIn(username: string, password: string): Promise<FamilySession> {
  return rememberSession(await request<FamilySession>('/auth/login', { username, password }))
}
export async function signOut(): Promise<void> {
  try {
    await request('/auth/logout', {})
  } catch (error) {
    if (!(error instanceof ApiError) || error.code !== 'csrf_failed') throw error
    // An expired session has a new CSRF token; logout is safe to retry once.
    await getSession()
    await request('/auth/logout', {})
  }
  csrfToken = ''
}
export async function changePassword(currentPassword: string, newPassword: string): Promise<FamilySession> {
  return rememberSession(await request<FamilySession>('/auth/password', { currentPassword, newPassword }))
}
export function getFamilyHome(signal?: AbortSignal): Promise<FamilyHome> {
  return request<FamilyHome>('/family', undefined, signal)
}
