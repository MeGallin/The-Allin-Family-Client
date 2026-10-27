export type JobScope = 'family' | 'mine'
export type JobHistory = {
  id: string
  action: string
  targetDate: string | null
  actor: { id: number; name: string }
  occurredAt: string
}
export type HouseholdJob = {
  id: string
  ownerId: number
  scope: JobScope
  title: string
  note: string
  area: string
  targetDate: string | null
  repeat: 'none' | 'weekly' | 'monthly'
  assigneeId: number | null
  done: boolean
  version: number
  history: JobHistory[]
}
export type JobsSnapshot = {
  ownerId: number
  jobs: HouseholdJob[]
  archive: HouseholdJob[]
  members: { id: number; name: string }[]
}
export type JobWrite = {
  action: 'add' | 'edit' | 'claim' | 'assign' | 'complete' | 'reopen' | 'remove' | 'reorder'
  body: Record<string, unknown>
}
export type JobDraft = Pick<
  HouseholdJob,
  'scope' | 'title' | 'note' | 'area' | 'targetDate' | 'repeat' | 'assigneeId'
>
