import type { FamilyUser } from '../types/auth'
import { request } from './api-client'

export type FamilyHomeResponse = { message: string; user: FamilyUser }

export function getFamilyHome(signal?: AbortSignal): Promise<FamilyHomeResponse> {
  return request<FamilyHomeResponse>('/family', undefined, signal)
}
