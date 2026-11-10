import { executeWrite } from '../../app/execute-write'
import type { AppDispatch, RootState } from '../../app/store'
import { whereApi } from '../../services/where-is-it-query'
import { widgetsApi } from '../../services/widgets-query'
import type { WhereWrite } from './types'

export const whereBusy = (state: RootState) =>
  whereApi.endpoints.changeWhereItem.select('where-write')(state).isLoading

export const executeWhereWrite =
  (write: WhereWrite) =>
  async (dispatch: AppDispatch, getState: () => RootState): Promise<boolean> => {
    const ownerId = getState().auth.user?.id
    if (!ownerId) return false
    return executeWrite(dispatch, getState, {
      busy: whereBusy,
      start: () => {
        dispatch(whereApi.util.getRunningQueryThunk('getWhereItems', ownerId))?.abort()
      },
      request: () =>
        dispatch(
          whereApi.endpoints.changeWhereItem.initiate(write, { fixedCacheKey: 'where-write' }),
        ).unwrap(),
      commit: async (data) => {
        if (data.ownerId !== ownerId) throw new Error('Your account changed. Sign in again.')
        await dispatch(whereApi.util.upsertQueryData('getWhereItems', ownerId, data))
        dispatch(widgetsApi.util.invalidateTags([{ type: 'Widgets', id: ownerId }]))
      },
      refresh: () =>
        dispatch(
          whereApi.endpoints.getWhereItems.initiate(ownerId, {
            subscribe: false,
            forceRefetch: true,
          }),
        ),
      finish: () => {},
    })
  }
