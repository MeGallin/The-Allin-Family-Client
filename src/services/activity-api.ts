import { request } from './api-client'
import type { ActivityFilters, ActivitySnapshot } from '../features/activity/types'
export function getAdminActivity(filters: ActivityFilters, signal?: AbortSignal) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) if (value) query.set(key, value)
  return request<ActivitySnapshot>('/admin/activity?' + query.toString(), undefined, signal)
}
