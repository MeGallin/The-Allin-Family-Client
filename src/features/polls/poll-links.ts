import { isPollClosed } from './poll-deadline'
import type { FamilyPollRecord } from './types'
export function pollLink(poll: Pick<FamilyPollRecord, 'id' | 'closed' | 'closesAt'>) {
  return `/polls?show=${isPollClosed(poll) ? 'closed' : 'open'}#poll-${poll.id}`
}
export function pollActionPath(
  search: string,
  hash: string,
  action: 'compose' | 'edit' | 'remove',
  value: string,
) {
  const params = new URLSearchParams(search)
  for (const key of ['compose', 'edit', 'remove']) params.delete(key)
  params.set(action, value)
  return '/polls?' + params.toString() + hash
}
export function pollStatus(value: string | null) {
  return value === 'closed' || value === 'all' ? value : 'open'
}
