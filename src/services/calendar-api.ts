import { request } from './api-client'
import { writeRequest } from './write-request'
import type { CalendarSnapshot } from '../features/calendar/types'
export const getCalendar = (signal?: AbortSignal) =>
  request<CalendarSnapshot>('/calendar', undefined, signal)
export const changeCalendar = (
  action: 'add' | 'edit' | 'remove',
  body: object,
  signal?: AbortSignal,
) => writeRequest<CalendarSnapshot>('/calendar/' + action, body, signal)
