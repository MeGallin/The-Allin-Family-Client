import type { FocusSnapshot, FocusReceipt, FocusSession } from '../features/focus-timer/types'
import { testUser } from './fixtures'
export const focusSnapshot = (extra: Partial<FocusSnapshot> = {}): FocusSnapshot => ({
  ownerId: testUser.id,
  version: 1,
  generation: 1,
  installed: true,
  defaults: { focus: 25, short: 5, long: 15 },
  session: null,
  serverTime: '2026-10-25T10:00:00.000Z',
  history: [],
  summary: { focusCompleted: 0, focusMs: 0, breakMs: 0 },
  days: Array.from({ length: 7 }, (_, i) => ({
    date: `2026-10-${19 + i}`,
    focusMs: 0,
    breakMs: 0,
    focusCompleted: 0,
  })),
  through: '2026-10-25',
  ...extra,
})
export const focusSession = (extra: Partial<FocusSession> = {}): FocusSession => ({
  id: '501',
  phase: 'focus',
  label: 'Synthetic session',
  durationMs: 300000,
  elapsedMs: 0,
  state: 'running',
  deadline: '2026-10-25T10:05:00Z',
  endedAt: null,
  ...extra,
})
export const focusReceipt = (s = focusSnapshot()): FocusReceipt => {
  const { history: _, days: __, summary: ___, through: ____, ...receipt } = s
  return receipt
}
