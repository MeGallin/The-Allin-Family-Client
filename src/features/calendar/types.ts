export type EventDraft = {
  title: string
  startsAt: string
  allDay: boolean
  annually: boolean
  timeZone: string
  detail: string
}
type Actor = { id: number; displayName: string }
export type FamilyEvent = EventDraft & {
  id: string
  version: number
  createdBy: Actor
  updatedBy: Actor
  createdAt: string
  updatedAt: string
  occursAt?: string
}
export type CalendarActivity = {
  id: string
  eventId: string
  action: 'created' | 'edited' | 'removed'
  actor: Actor
  occurredAt: string
  before: EventDraft | null
  after: EventDraft | null
}
export type CalendarSnapshot = { events: FamilyEvent[]; activity: CalendarActivity[] }
