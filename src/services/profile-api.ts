import { ApiError, request } from './api-client'
import { getSession } from './auth-api'
import type { FamilyUser } from '../types/auth'
export type ProfileResponse = { profile: FamilyUser }
export type NicknameResponse = ProfileResponse & { self: FamilyUser }
export type NicknameChange = { nickname: string; version: number; userId?: number }
export const getProfile = (signal?: AbortSignal) =>
  request<ProfileResponse>('/profile', undefined, signal)
export const getAdminUsers = (signal?: AbortSignal) =>
  request<{ users: FamilyUser[] }>('/admin/users', undefined, signal)
export async function changeNickname({ userId, ...body }: NicknameChange) {
  const path = userId === undefined ? '/profile/nickname' : '/admin/users/nickname'
  const payload = userId === undefined ? body : { ...body, id: userId }
  try {
    return await request<NicknameResponse>(path, payload)
  } catch (error) {
    if (!(error instanceof ApiError) || error.code !== 'csrf_failed') throw error
    await getSession()
    return request<NicknameResponse>(path, payload)
  }
}
