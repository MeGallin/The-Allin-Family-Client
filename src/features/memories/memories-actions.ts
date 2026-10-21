import { executeWrite } from '../../app/execute-write'
import type { AppDispatch, RootState } from '../../app/store'
import { memoriesApi } from '../../services/memories-query'
import { changeMemory } from '../../services/memories-api'

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
    return executeWrite(dispatch, getState, {
      busy: (state) => state.memoriesUi.busy,
      start: () => {
        dispatch(memoryWriteStarted())
        dispatch(memoriesApi.util.getRunningQueryThunk('getMemories', undefined))?.abort()
      },
      request: () => changeMemory(action, body, photo),
      commit: async (data) => {
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
      },
      refresh: () =>
        dispatch(
          memoriesApi.endpoints.getMemories.initiate(undefined, {
            subscribe: false,
            forceRefetch: true,
          }),
        ),
      failed: (error) => {
        dispatch(memoryWriteFailed(error))
      },
      finish: () => {
        dispatch(memoryWriteFinished())
      },
    })
  }
