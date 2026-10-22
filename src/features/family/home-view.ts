import { isPollClosed } from '../polls/poll-deadline'
import type { FamilyMemory } from '../memories/types'
import type { FamilyPollRecord } from '../polls/types'

// Copies keep the shared RTK Query snapshots immutable. Stable IDs break timestamp ties.
function newest(a: { id: string; createdAt: string }, b: { id: string; createdAt: string }) {
  return (
    Date.parse(b.createdAt) - Date.parse(a.createdAt) ||
    b.id.localeCompare(a.id, 'en-GB', { numeric: true })
  )
}
export function recentMemories(memories: FamilyMemory[]) {
  return [...memories].sort(newest).slice(0, 3)
}
export function homePolls(polls: FamilyPollRecord[], now = Date.now()) {
  const open = polls.filter((poll) => !isPollClosed(poll, now)).sort(newest)
  return {
    open,
    // Keep the featured question stable while a person votes or withdraws.
    featured: open[0],
    nextClosing: [...open].sort(
      (a, b) => Date.parse(a.closesAt) - Date.parse(b.closesAt) || newest(a, b),
    )[0],
    awaitingVote: open.filter((poll) => !poll.ownOptionId).length,
    recentResult: polls.filter((poll) => isPollClosed(poll, now)).sort(newest)[0],
  }
}
