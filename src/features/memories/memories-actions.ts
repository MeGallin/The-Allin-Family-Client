import type { AppDispatch, RootState } from '../../app/store'
import { memoriesApi } from '../../services/memories-query'
import { changeMemory } from '../../services/memories-api'
import { serializableError } from '../../services/shopping-query'
import {
  memoryWriteStarted,
  memoryWriteFinished,
  memoryWriteFailed,
  memoryFeedback,
} from './memories-ui-slice'
import type { MemoryAction } from './types'

export const executeMemoryWrite =
  (action: MemoryAction, body: object, photo?: File) =>
  async (dispatch: AppDispatch, getState: () => RootState): Promise<boolean> => {
    if (getState().memoriesUi.busy) return false
    const generation = getState().auth.generation
    dispatch(memoryWriteStarted())
    dispatch(memoriesApi.util.getRunningQueryThunk('getMemories', undefined))?.abort()
    try {
      const data = await changeMemory(action, body, photo)
      if (generation !== getState().auth.generation) return false
      await dispatch(memoriesApi.util.upsertQueryData('getMemories', undefined, data))
      dispatch(memoriesApi.util.invalidateTags(['Memories']))
      dispatch(
        memoryFeedback(
          action === 'add'
            ? 'Memory shared with the family.'
            : action === 'edit'
              ? 'Memory changes saved for everyone.'
              : action === 'remove'
                ? 'Memory removed. Its history has been kept.'
                : 'Your reaction has been saved.',
        ),
      )
      return true
    } catch (error) {
      if (generation !== getState().auth.generation) return false
      const failure = serializableError(error)
      dispatch(memoryWriteFailed(failure))
      if (failure.status === 409)
        await dispatch(
          memoriesApi.endpoints.getMemories.initiate(undefined, {
            subscribe: false,
            forceRefetch: true,
          }),
        )
      return false
    } finally {
      if (generation === getState().auth.generation) dispatch(memoryWriteFinished())
    }
  }
