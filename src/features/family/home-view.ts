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
export function homePolls(polls: FamilyPollRecord[]) {
  const open = polls.filter((poll) => !poll.closed).sort(newest)
  return {
    open,
    // Keep the featured question stable while a person votes or withdraws.
    featured: open[0],
    recentResult: polls.filter((poll) => poll.closed).sort(newest)[0],
  }
}
