import type { PersonalNote } from './types'
export const noteSorts = [
  ['updated', 'Recently edited'],
  ['newest', 'Newest added'],
  ['date', 'Note date: newest'],
  ['oldest', 'Note date: oldest'],
  ['name', 'Title A–Z'],
] as const
export type NoteSort = (typeof noteSorts)[number][0]
export function notesView(notes: PersonalNote[], query: string, sort: NoteSort) {
  const text = query.trim().toLocaleLowerCase('en-GB')
  return notes
    .filter(
      (note) =>
        !text ||
        [note.title, note.header, note.body, note.footer].some((value) =>
          value.toLocaleLowerCase('en-GB').includes(text),
        ),
    )
    .sort((a, b) => {
      const order =
        sort === 'name'
          ? a.title.localeCompare(b.title, 'en-GB', { numeric: true, sensitivity: 'base' })
          : sort === 'updated'
            ? Date.parse(b.updatedAt) - Date.parse(a.updatedAt)
            : sort === 'newest'
              ? Date.parse(b.createdAt) - Date.parse(a.createdAt)
              : sort === 'oldest'
                ? a.noteDate.localeCompare(b.noteDate)
                : b.noteDate.localeCompare(a.noteDate)
      return order || b.id.localeCompare(a.id, 'en-GB', { numeric: true })
    })
}
