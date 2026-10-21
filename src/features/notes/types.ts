export type NoteDraft = {
  title: string
  header: string
  body: string
  footer: string
  noteDate: string
}
export type PersonalNote = NoteDraft & {
  id: string
  version: number
  createdAt: string
  updatedAt: string
}
export type NoteActivity = {
  id: string
  noteId: string
  action: 'created' | 'edited' | 'removed'
  occurredAt: string
  before: Pick<NoteDraft, 'title'> | null
  after: Pick<NoteDraft, 'title'> | null
}
export type NotesSnapshot = { ownerId: number; notes: PersonalNote[]; activity: NoteActivity[] }
export type NoteWrite = { action: 'add' | 'edit' | 'remove'; body: object }
