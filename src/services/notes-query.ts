import { shoppingApi, serializableError } from './shopping-query'
import { ApiError } from './api-client'
import { getNotes, changeNote } from './notes-api'
import type { NotesSnapshot, NoteWrite } from '../features/notes/types'
export const notesApi = shoppingApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotes: builder.query<NotesSnapshot, number>({
      async queryFn(ownerId, { signal }) {
        try {
          const data = await getNotes(signal)
          if (data.ownerId !== ownerId)
            throw new ApiError(
              'Your account changed. Please sign in again.',
              401,
              'account_changed',
            )
          return { data }
        } catch (error) {
          return { error: serializableError(error) }
        }
      },
      providesTags: (_, __, ownerId) => [{ type: 'Notes', id: ownerId }],
    }),
    changeNote: builder.mutation<NotesSnapshot, NoteWrite>({
      async queryFn(write, { signal }) {
        try {
          return { data: await changeNote(write, signal) }
        } catch (error) {
          return { error: serializableError(error) }
        }
      },
    }),
  }),
})
