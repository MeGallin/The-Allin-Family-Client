export type ActivityFilters = { type: string; actor: string; before: string; days: string }
export type ActivityEntry = {
  id: string
  entityType: string
  entityId: string
  targetName: string | null
  action: string
  actor: { id: number; displayName: string }
  occurredAt: string
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
}
export type ActivitySnapshot = {
  days: number
  from: string | null
  through: string
  entries: ActivityEntry[]
  nextCursor: string | null
}
