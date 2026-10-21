import { request, ApiError } from './api-client'
import { getSession } from './auth-api'
import type { CalendarSnapshot } from '../features/calendar/types'

export function getCalendar(signal?: AbortSignal) {
  return request<CalendarSnapshot>('/calendar', undefined, signal)
}
export async function changeCalendar(action: 'add' | 'edit' | 'remove', body: object) {
  try {
    return await request<CalendarSnapshot>('/calendar/' + action, body)
  } catch (error) {
    if (!(error instanceof ApiError) || error.code !== 'csrf_failed') throw error
    await getSession()
    return request<CalendarSnapshot>('/calendar/' + action, body)
  }
}
