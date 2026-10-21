import { useAppDispatch, useAppSelector } from '../../app/store-hooks'
import { memoriesApi } from '../../services/memories-query'
import { shoppingError } from '../../services/shopping-query'
import { executeMemoryWrite } from './memories-actions'
import { memoryErrorCleared } from './memories-ui-slice'
import type { FamilyMemory, MemoryDraft } from './types'
export function useMemories() {
  const dispatch = useAppDispatch()
  const query = memoriesApi.endpoints.getMemories.useQueryState(undefined)
  const ui = useAppSelector((state) => state.memoriesUi)
  const failure = ui.error ?? shoppingError(query.error)
  return {
    memories: query.data?.memories ?? [],
    activity: query.data?.activity ?? [],
    loading: !query.data && (query.isLoading || query.isUninitialized),
    pending: ui.busy,
    feedback: ui.feedback,
    failure,
    error: failure?.message ?? '',
    clearError: () => dispatch(memoryErrorCleared()),
    refresh: () => {
      dispatch(memoryErrorCleared())
      void dispatch(
        memoriesApi.endpoints.getMemories.initiate(undefined, {
          subscribe: false,
          forceRefetch: true,
        }),
      )
    },
    add: (draft: MemoryDraft, requestKey: string, photo?: File) =>
      dispatch(executeMemoryWrite('add', { ...draft, requestKey }, photo)),
    edit: (memory: FamilyMemory, draft: MemoryDraft, photo?: File) =>
      dispatch(
        executeMemoryWrite('edit', { ...draft, id: memory.id, version: memory.version }, photo),
      ),
    remove: (memory: FamilyMemory) =>
      dispatch(executeMemoryWrite('remove', { id: memory.id, version: memory.version })),
    react: (memory: FamilyMemory) =>
      dispatch(executeMemoryWrite('react', { id: memory.id, liked: !memory.liked })),
  }
}
