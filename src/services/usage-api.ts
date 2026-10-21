import { request } from './api-client'
import { writeRequest } from './write-request'
import type { UsageFilters, UsageSnapshot } from '../features/usage/types'

export function sendPresence(page: string, active: boolean, signal?: AbortSignal) {
  return writeRequest<{ ok: boolean }>('/auth/presence', { page, active }, signal)
}

export function getAdminUsage(filters: UsageFilters, signal?: AbortSignal) {
  const query = new URLSearchParams(filters)
  return request<UsageSnapshot>('/admin/usage?' + query.toString(), undefined, signal)
}
