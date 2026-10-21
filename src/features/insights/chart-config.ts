import { format, parseISO } from 'date-fns'
export const activitySeries = [
  { key: 'created', label: 'Added', color: 'var(--chart-created)' },
  { key: 'updated', label: 'Updated', color: 'var(--chart-updated)' },
  { key: 'responded', label: 'Votes & reactions', color: 'var(--chart-responded)' },
  { key: 'removed', label: 'Removed', color: 'var(--chart-removed)' },
] as const
export const featureNames: Record<string, string> = {
  shopping_item: 'Shopping',
  calendar_event: 'Calendar',
  memory: 'Memories',
  poll: 'Polls',
  user_profile: 'Nicknames',
  user_account: 'Family accounts',
}
export function chartDate(day: string, full = false) {
  return format(parseISO(day), full ? 'EEEE, d MMM yyyy' : 'd MMM')
}
