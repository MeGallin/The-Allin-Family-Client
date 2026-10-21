import type { FamilySession } from '../types/auth'
import { ApiError, request, setCsrfToken } from './api-client'

function rememberSession(session: FamilySession): FamilySession {
  setCsrfToken(session.csrfToken)
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
    await getSession()
    await request('/auth/logout', {})
  }
  setCsrfToken('')
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<FamilySession> {
  return rememberSession(
    await request<FamilySession>('/auth/password', { currentPassword, newPassword }),
  )
}
