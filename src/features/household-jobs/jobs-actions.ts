import { executeWrite } from '../../app/execute-write'
import type { AppDispatch, RootState } from '../../app/store'
import { jobsApi } from '../../services/household-jobs-query'
import {
  jobsOrderUnconfirmed,
  jobsStarted,
  jobsFinished,
  jobsFeedback,
  jobsError,
} from './jobs-ui-slice'
import type { JobWrite } from './types'
export const executeJobWrite =
  (write: JobWrite) =>
  async (dispatch: AppDispatch, getState: () => RootState): Promise<boolean> => {
    const owner = getState().auth.user?.id
    if (!owner) return false
    if (
      write.action === 'reorder' &&
      (write.body.scope === 'family' || write.body.scope === 'mine') &&
      getState().jobsUi.orderNeedsRefresh[write.body.scope]
    )
      return false
    return executeWrite(dispatch, getState, {
      busy: (s) => s.jobsUi.busy,
      start: () => {
        dispatch(jobsStarted())
        dispatch(jobsApi.util.getRunningQueryThunk('getJobs', owner))?.abort()
      },
      request: () => dispatch(jobsApi.endpoints.changeJob.initiate(write)).unwrap(),
      commit: async (data) => {
        if (data.ownerId !== owner) throw new Error('Your account changed. Sign in again.')
        await dispatch(jobsApi.util.upsertQueryData('getJobs', owner, data))
        dispatch(
          jobsFeedback(
            write.action === 'reorder'
              ? 'Order saved.'
              : write.action === 'remove'
                ? 'Job removed. History kept.'
                : 'Job saved.',
          ),
        )
      },
      refresh: () =>
        dispatch(
          jobsApi.endpoints.getJobs.initiate(owner, { subscribe: false, forceRefetch: true }),
        ),
      failed: (e) => {
        // A server write may have committed before its response/snapshot failed.
        if (
          write.action === 'reorder' &&
          (e.status === 0 || e.status === 408 || e.status >= 500) &&
          (write.body.scope === 'family' || write.body.scope === 'mine')
        )
          dispatch(jobsOrderUnconfirmed(write.body.scope))
        dispatch(
          jobsError(
            e.message +
              (e.status === 0
                ? write.action === 'reorder'
                  ? ' Saving could not be confirmed. Refresh jobs before moving again.'
                  : ' Saving could not be confirmed. Retry the same action or refresh to check.'
                : ''),
          ),
        )
      },
      finish: () => dispatch(jobsFinished()),
    })
  }
