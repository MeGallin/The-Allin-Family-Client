import type { WordSnapshot, WordReceipt } from '../features/daily-word/types'
import { testUser } from './fixtures'
export const wordSnapshot = (extra: Partial<WordSnapshot> = {}): WordSnapshot => ({
  ownerId: testUser.id,
  installed: true,
  installationVersion: 1,
  day: '2026-10-25',
  clock: {
    currentDay: '2026-10-25',
    serverTime: '2026-10-25T10:00:00Z',
    nextMidnight: '2026-10-26T00:00:00Z',
  },
  progress: { guesses: [], revision: 0, finished: false, solved: false, shared: false },
  week: [],
  ...extra,
})
export const wordReceipt = (snapshot = wordSnapshot()): WordReceipt => {
  const { week: _, ...receipt } = snapshot
  return receipt
}
