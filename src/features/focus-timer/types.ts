export type FocusPhase = 'focus' | 'short' | 'long'
export type FocusSession = {
  id: string
  phase: FocusPhase
  label: string
  durationMs: number
  elapsedMs: number
  state: 'running' | 'paused' | 'elapsed' | 'completed' | 'early' | 'discarded' | 'elapsed_removed'
  deadline: string | null
  endedAt: string | null
}
export type FocusState = {
  ownerId: number
  version: number
  generation: number
  installed: boolean
  defaults: Record<FocusPhase, number>
  session: FocusSession | null
  serverTime: string
}
export type FocusSnapshot = FocusState & {
  days: { date: string; focusMs: number; breakMs: number; focusCompleted: number }[]
  history: FocusSession[]
  summary: { focusCompleted: number; focusMs: number; breakMs: number }
  through: string
}
export type FocusReceipt = FocusState
export type FocusWrite = {
  action: 'install' | 'start' | 'pause' | 'resume' | 'finish' | 'reset' | 'next' | 'remove'
  body: object
}
export type FocusWriteResult = {
  receipt: FocusReceipt | null
  failure: { status: number; code: string; message: string } | null
}
export const FOCUS_PATH = '/my-space?view=widgets&tool=focus'
export const focusPhases: { id: FocusPhase; label: string }[] = [
  { id: 'focus', label: 'Focus' },
  { id: 'short', label: 'Short break' },
  { id: 'long', label: 'Long break' },
]
