import { createSearchMatcher, filterOption } from '../../lib/search'
import { isPollClosed } from './poll-deadline'
import type { FamilyPollRecord } from './types'
export const pollStatuses = [
  ['open', 'Open for votes'],
  ['closed', 'Voting closed'],
  ['all', 'All polls'],
] as const
export type PollStatus = (typeof pollStatuses)[number][0]
export function pollStatus(value: string | null): PollStatus {
  return filterOption(value, pollStatuses, 'open')
}
export function pollsView(
  polls: FamilyPollRecord[],
  query: string,
  status: PollStatus,
  now: number,
) {
  const matches = createSearchMatcher(query)
  return polls.filter(
    (poll) =>
      (status === 'all' ||
        (status === 'open' ? !isPollClosed(poll, now) : isPollClosed(poll, now))) &&
      matches([poll.title, poll.detail, poll.createdBy.displayName, poll.updatedBy.displayName]),
  )
}
