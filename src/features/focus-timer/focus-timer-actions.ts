import { executeWrite } from '../../app/execute-write'
import type { AppDispatch, RootState } from '../../app/store'
import { focusTimerApi } from '../../services/focus-timer-query'
import {
  focusTimerWriteStarted,
  focusTimerWriteFinished,
  focusTimerSaved,
} from './focus-timer-ui-slice'
import type { FocusWrite, FocusReceipt, FocusWriteResult } from './types'
export const executeFocusTimerWrite =
  (write: FocusWrite) =>
  async (dispatch: AppDispatch, getState: () => RootState): Promise<FocusWriteResult> => {
    const ownerId = getState().auth.user?.id
    if (!ownerId) return { receipt: null, failure: null }
    let receipt: FocusReceipt | null = null
    let failure: FocusWriteResult['failure'] = null
    const refresh = () =>
      dispatch(
        focusTimerApi.endpoints.getFocusTimer.initiate(ownerId, {
          subscribe: false,
          forceRefetch: true,
        }),
      )
    const saved = await executeWrite(dispatch, getState, {
      busy: (state) => state.focusTimerUi.busy,
      start: () => {
        dispatch(focusTimerWriteStarted())
        dispatch(focusTimerApi.util.getRunningQueryThunk('getFocusTimer', ownerId))?.abort()
      },
      request: () =>
        dispatch(
          focusTimerApi.endpoints.changeFocusTimer.initiate(write, {
            fixedCacheKey: 'focus-timer-write',
          }),
        ).unwrap(),
      commit: async (data) => {
        if (data.ownerId !== ownerId) throw new Error('Your account changed. Please sign in again.')
        receipt = data
        // Receipts are immutable historical acknowledgements; never replace the current board with one.
        await refresh()
        dispatch(focusTimerSaved('Your timer is saved.'))
      },
      refresh,
      failed: (error) => {
        failure = error
      },
      finish: () => {
        dispatch(focusTimerWriteFinished())
      },
    })
    return { receipt: saved ? receipt : null, failure }
  }
