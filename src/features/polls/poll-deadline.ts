import type { FamilyPollRecord } from './types'
export const DEFAULT_POLL_HOURS = 4
export function deadlineFromHours(hours = DEFAULT_POLL_HOURS) {
  return new Date(Date.now() + hours * 3_600_000).toISOString()
}
export function isPollClosed(
  poll: Pick<FamilyPollRecord, 'closed' | 'closesAt'>,
  now = Date.now(),
) {
  return poll.closed || Date.parse(poll.closesAt) <= now
}
export function formatPollDeadline(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Choose a closing time'
    : new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      }).format(date)
}
export function localDeadlineInput(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** Compact remaining time for dashboard summaries; exact time is always available alongside it. */
export function pollTimeLeft(value: string, now: number, style: 'compact' | 'long' = 'compact') {
  const remaining = Date.parse(value) - now
  if (!Number.isFinite(remaining)) return 'Time unavailable'
  if (remaining <= 0) return 'Voting closed'
  if (remaining < 60_000) return 'Less than a minute left'
  const minutes = Math.ceil(remaining / 60_000)
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  const mins = minutes % 60
  const units = days
    ? ([
        [days, 'd', 'day'],
        [hours, 'h', 'hour'],
      ] as const)
    : ([
        [hours, 'h', 'hour'],
        [mins, 'm', 'minute'],
      ] as const)
  const parts = units
    .filter(([count]) => count > 0)
    .map(([count, short, long]) =>
      style === 'compact' ? count + short : `${count} ${long}${count === 1 ? '' : 's'}`,
    )
  return parts.join(style === 'compact' ? ' ' : ' and ') + ' left'
}
