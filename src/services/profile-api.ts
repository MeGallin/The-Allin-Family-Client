import { request } from './api-client'
import { writeRequest } from './write-request'
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
  return writeRequest<NicknameResponse>(path, payload)
}
