import type { AppDispatch, RootState } from '../../app/store'
import { executeWrite } from '../../app/execute-write'
import { pollsApi } from '../../services/polls-query'
import { pollWriteStarted, pollWriteFinished, pollFeedback } from './polls-ui-slice'
import type { PollWrite } from './types'
const messages = {
  add: 'Poll shared with the family.',
  edit: 'Poll changes saved.',
  vote: 'Your vote is saved.',
  close: 'Voting status updated.',
  remove: 'Poll removed. Its history has been kept.',
}
export const executePollWrite =
  (write: PollWrite) =>
  async (dispatch: AppDispatch, getState: () => RootState): Promise<boolean> =>
    executeWrite(dispatch, getState, {
      busy: (state) => state.pollsUi.busy,
      start: () => {
        dispatch(pollWriteStarted())
        dispatch(pollsApi.util.getRunningQueryThunk('getPolls', undefined))?.abort()
      },
      request: () =>
        dispatch(
          pollsApi.endpoints.changePoll.initiate(write, { fixedCacheKey: 'shared-poll-write' }),
        ).unwrap(),
      commit: async (data) => {
        await dispatch(pollsApi.util.upsertQueryData('getPolls', undefined, data))
        dispatch(pollsApi.util.invalidateTags(['Polls']))
        dispatch(
          pollFeedback(
            write.action === 'vote' && 'optionId' in write.body && write.body.optionId === null
              ? 'Your vote has been withdrawn.'
              : write.action === 'close' && 'closed' in write.body
                ? write.body.closed
                  ? 'Voting closed. Choose Voting closed or All polls to see the final results.'
                  : 'Voting reopened. Choose Open for votes or All polls to vote.'
                : messages[write.action],
          ),
        )
      },
      refresh: () =>
        dispatch(
          pollsApi.endpoints.getPolls.initiate(undefined, { subscribe: false, forceRefetch: true }),
        ),
      finish: () => {
        dispatch(pollWriteFinished())
      },
    })
