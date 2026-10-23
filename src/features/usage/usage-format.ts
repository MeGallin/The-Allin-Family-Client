import type { UsageSession } from './types'

export function usageDuration(seconds: number) {
  if (seconds === 0) return '0 min'
  if (seconds < 60) return 'Less than a minute'
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  return hours ? `${hours} hr${minutes % 60 ? ` ${minutes % 60} min` : ''}` : `${minutes} min`
}

export const usagePages: Record<string, string> = {
  '/': 'Home',
  '/calendar': 'Calendar',
  '/alerts': 'Alerts',
  '/memories': 'Memories',
  '/lists': 'Shopping list',
  '/polls': 'Polls',
  '/notes': 'Personal Notes',
  '/profile': 'Profile',
  '/admin': 'Administration',
  '/other': 'Other page',
}

export const usageStatus: Record<UsageSession['status'], string> = {
  active: 'Active recently',
  recent: 'Recently seen',
  inactive: 'Inactive · no sign-out recorded',
  logout: 'Signed out',
  expired: 'Session expired',
  revoked: 'Session revoked',
  replaced: 'Replaced by a new sign-in',
}
