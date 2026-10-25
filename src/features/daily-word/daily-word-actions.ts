import { executeWrite } from '../../app/execute-write'
import type { AppDispatch, RootState } from '../../app/store'
import { dailyWordApi } from '../../services/daily-word-query'
import {
  dailyWordWriteStarted,
  dailyWordWriteFinished,
  dailyWordSaved,
} from './daily-word-ui-slice'
import type { WordWrite, WordReceipt, WordWriteResult } from './types'
export const executeDailyWordWrite =
  (write: WordWrite) =>
  async (dispatch: AppDispatch, getState: () => RootState): Promise<WordWriteResult> => {
    const ownerId = getState().auth.user?.id
    if (!ownerId) return { receipt: null, failure: null }
    let receipt: WordReceipt | null = null
    let failure: WordWriteResult['failure'] = null
    const refresh = () =>
      dispatch(
        dailyWordApi.endpoints.getDailyWord.initiate(ownerId, {
          subscribe: false,
          forceRefetch: true,
        }),
      )
    const saved = await executeWrite(dispatch, getState, {
      busy: (state) => state.dailyWordUi.busy,
      start: () => {
        dispatch(dailyWordWriteStarted())
        dispatch(dailyWordApi.util.getRunningQueryThunk('getDailyWord', ownerId))?.abort()
      },
      request: () =>
        dispatch(
          dailyWordApi.endpoints.changeDailyWord.initiate(write, {
            fixedCacheKey: 'daily-word-write',
          }),
        ).unwrap(),
      commit: async (data) => {
        if (data.ownerId !== ownerId) throw new Error('Your account changed. Please sign in again.')
        receipt = data
        // Receipts are immutable historical acknowledgements; never replace the current board with one.
        await refresh()
        dispatch(dailyWordApi.util.invalidateTags(['DailyWordResults']))
        dispatch(
          dailyWordSaved(
            write.action === 'guess'
              ? 'Your guess is saved.'
              : write.action === 'share'
                ? 'Your finished result is shared.'
                : write.action === 'withdraw'
                  ? 'Your result is private again.'
                  : write.action === 'install'
                    ? 'Daily Word installed.'
                    : 'Daily Word removed.',
          ),
        )
      },
      refresh,
      failed: (error) => {
        failure = error
      },
      finish: () => {
        dispatch(dailyWordWriteFinished())
      },
    })
    return { receipt: saved ? receipt : null, failure }
  }
