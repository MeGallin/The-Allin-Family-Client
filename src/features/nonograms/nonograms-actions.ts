import { executeWrite } from '../../app/execute-write'
import type { AppDispatch, RootState } from '../../app/store'
import { nonogramApi } from '../../services/nonograms-query'
import {
  nonogramWriteStarted,
  nonogramWriteFinished,
  nonogramWriteFailed,
  nonogramAccepted,
} from './nonograms-ui-slice'
import type { NonogramWrite } from './types'
export const executeNonogramWrite =
  (write: NonogramWrite) =>
  async (dispatch: AppDispatch, getState: () => RootState): Promise<boolean> => {
    const { user, generation } = getState().auth
    const ownerId = user?.id
    if (!ownerId) return false
    const uncertain = getState().nonogramUi.uncertain
    if (uncertain && JSON.stringify(uncertain) !== JSON.stringify(write)) return false
    return executeWrite(dispatch, getState, {
      busy: (state) => state.nonogramUi.busy,
      start: () => {
        dispatch(nonogramWriteStarted(write))
        dispatch(nonogramApi.util.getRunningQueryThunk('getNonogram', ownerId))?.abort()
      },
      request: () =>
        dispatch(
          nonogramApi.endpoints.changeNonogram.initiate(write, { fixedCacheKey: 'nonogram-write' }),
        ).unwrap(),
      commit: async (data) => {
        if (data.ownerId !== ownerId) throw new Error('Your account changed. Please sign in again.')
        await dispatch(nonogramApi.util.upsertQueryData('getNonogram', ownerId, data))
        if (getState().auth.generation !== generation) return
        // An immutable retry receipt may predate the current installation, including removal.
        const latest = nonogramApi.endpoints.getNonogram.select(ownerId)(getState()).data!
        dispatch(nonogramAccepted({ ownerId, game: latest.game, reset: write.action !== 'save' }))
        // Receipts are immutable. Refresh separately in case a later tab has already advanced.
        dispatch(nonogramApi.util.invalidateTags([{ type: 'Nonograms', id: ownerId }]))
      },
      failed: (failure) =>
        dispatch(
          nonogramWriteFailed({
            message: failure.message,
            conflict: [404, 409].includes(failure.status),
            uncertain: failure.status === 0 || failure.status >= 500,
          }),
        ),
      refresh: () =>
        dispatch(
          nonogramApi.endpoints.getNonogram.initiate(ownerId, {
            subscribe: false,
            forceRefetch: true,
          }),
        ),
      finish: () => {
        dispatch(nonogramWriteFinished())
      },
    })
  }
