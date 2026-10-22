import { useLiveQueryOptions } from '../../hooks/useLiveQueryOptions'
import { useEffect } from 'react'
import { calendarApi } from '../../services/calendar-query'
import { useCalendar } from './useCalendar'
export function CalendarSync({ onSessionExpired }: { onSessionExpired: () => void }) {
  const { pending, failure } = useCalendar()
  calendarApi.useGetCalendarQuery(undefined, useLiveQueryOptions('/calendar', pending))
  useEffect(() => {
    if (failure?.status === 401 || failure?.code === 'password_change_required') onSessionExpired()
  }, [failure?.status, failure?.code, onSessionExpired])
  return null
}
