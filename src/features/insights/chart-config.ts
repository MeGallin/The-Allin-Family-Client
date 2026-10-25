import { format, parseISO } from 'date-fns'
export const activitySeries = [
  { key: 'created', label: 'Added', color: 'var(--chart-created)' },
  { key: 'updated', label: 'Updated', color: 'var(--chart-updated)' },
  { key: 'responded', label: 'Votes, reactions & spins', color: 'var(--chart-responded)' },
  { key: 'removed', label: 'Removed', color: 'var(--chart-removed)' },
] as const
export const featureNames: Record<string, string> = {
  shopping_item: 'Shopping',
  calendar_event: 'Calendar',
  memory: 'Memories',
  poll: 'Polls',
  user_profile: 'Profiles and preferences',
  user_account: 'Family accounts',
  widget: 'Widgets',
  daily_word: 'Daily Word lifecycle',
  focus_timer: 'Focus Timer lifecycle',
}
export const featureChartNames: Record<string, string> = {
  ...featureNames,
  user_profile: 'Profiles',
  user_account: 'Accounts',
  daily_word: 'Daily Word',
  focus_timer: 'Focus Timer',
}
export function chartDate(day: string, full = false) {
  return format(parseISO(day), full ? 'EEEE, d MMM yyyy' : 'd MMM')
}
