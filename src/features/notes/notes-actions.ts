import { executeWrite } from '../../app/execute-write'
import type { AppDispatch, RootState } from '../../app/store'
import { notesApi } from '../../services/notes-query'

import { noteWriteStarted, noteWriteFinished, noteFeedback } from './notes-ui-slice'
import type { NoteWrite } from './types'
export const executeNoteWrite =
  (write: NoteWrite) =>
  async (dispatch: AppDispatch, getState: () => RootState): Promise<boolean> => {
    const ownerId = getState().auth.user?.id
    if (!ownerId) return false
    return executeWrite(dispatch, getState, {
      busy: (state) => state.notesUi.busy,
      start: () => {
        dispatch(noteWriteStarted())
        dispatch(notesApi.util.getRunningQueryThunk('getNotes', ownerId))?.abort()
      },
      request: () =>
        dispatch(
          notesApi.endpoints.changeNote.initiate(write, { fixedCacheKey: 'private-note-write' }),
        ).unwrap(),
      commit: async (data) => {
        if (data.ownerId !== ownerId) throw new Error('Your account changed. Please sign in again.')
        await dispatch(notesApi.util.upsertQueryData('getNotes', ownerId, data))
        dispatch(notesApi.util.invalidateTags([{ type: 'Notes', id: ownerId }]))
        dispatch(
          noteFeedback(
            write.action === 'add'
              ? 'Note saved in your private notebook.'
              : write.action === 'edit'
                ? 'Your note changes are saved.'
                : 'Note deleted from your notebook. Its history remains private to you.',
          ),
        )
      },
      refresh: () =>
        dispatch(
          notesApi.endpoints.getNotes.initiate(ownerId, { subscribe: false, forceRefetch: true }),
        ),

      finish: () => {
        dispatch(noteWriteFinished())
      },
    })
  }
