import { useLiveQueryOptions } from '../../hooks/useLiveQueryOptions'
import { useRemovals } from '../removals/useRemovals'
import { useAppDispatch, useAppSelector } from '../../app/store-hooks'
import { notesApi } from '../../services/notes-query'
import { shoppingError } from '../../services/shopping-query'
import { executeNoteWrite } from './notes-actions'
import type { NoteDraft, PersonalNote } from './types'
export function usePersonalNotes() {
  const removal = useRemovals('notes')
  const dispatch = useAppDispatch()
  const ownerId = useAppSelector((state) => state.auth.user?.id)
  const ui = useAppSelector((state) => state.notesUi)
  const live = useLiveQueryOptions('/notes', ui.busy)
  const query = notesApi.useGetNotesQuery(ownerId ?? 0, {
    ...live,
    skip: !ownerId || live.skip,
  })
  const [, mutation] = notesApi.useChangeNoteMutation({ fixedCacheKey: 'private-note-write' })
  const failure = shoppingError(mutation.error) ?? shoppingError(query.error)
  const data = query.data?.ownerId === ownerId ? query.data : undefined
  return {
    notes: data?.notes ?? [],
    activity: data?.activity ?? [],
    loading: !data && (query.isUninitialized || query.isLoading),
    pending: ui.busy,
    feedback: ui.feedback,
    failure,
    error: failure?.message ?? '',
    clearError: mutation.reset,
    refresh: () => {
      mutation.reset()
      if (ownerId)
        void dispatch(
          notesApi.endpoints.getNotes.initiate(ownerId, { subscribe: false, forceRefetch: true }),
        )
    },
    add: (draft: NoteDraft, requestKey: string) =>
      dispatch(executeNoteWrite({ action: 'add', body: { ...draft, requestKey } })),
    edit: (note: PersonalNote, draft: NoteDraft) =>
      dispatch(
        executeNoteWrite({
          action: 'edit',
          body: { ...draft, id: note.id, version: note.version },
        }),
      ),
    ...removal,
  }
}
