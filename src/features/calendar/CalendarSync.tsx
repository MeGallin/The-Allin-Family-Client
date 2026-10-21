import { useEffect } from 'react'
import { calendarApi } from '../../services/calendar-query'
import { useCalendar } from './useCalendar'
export function CalendarSync({ onSessionExpired }: { onSessionExpired: () => void }) {
  const { pending, failure } = useCalendar()
  calendarApi.useGetCalendarQuery(undefined, {
    pollingInterval: pending ? 0 : 15000,
    skipPollingIfUnfocused: true,
  })
  useEffect(() => {
    if (failure?.status === 401 || failure?.code === 'password_change_required') onSessionExpired()
  }, [failure?.status, failure?.code, onSessionExpired])
  return null
}
