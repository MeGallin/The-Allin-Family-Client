import { request } from './api-client'
import { writeRequest } from './write-request'
import type { NotesSnapshot, NoteWrite } from '../features/notes/types'
export const getNotes = (signal?: AbortSignal) =>
  request<NotesSnapshot>('/notes', undefined, signal)
export const changeNote = ({ action, body }: NoteWrite, signal?: AbortSignal) =>
  writeRequest<NotesSnapshot>('/notes/' + action, body, signal)
