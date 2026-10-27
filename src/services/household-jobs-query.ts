import { jobsOrdersReconciled } from '../features/household-jobs/jobs-ui-slice'
import { shoppingApi, serializableError } from './shopping-query'
import { request, ApiError } from './api-client'
import { writeRequest } from './write-request'
import { withRequestTimeout } from './request-timeout'
import type { JobsSnapshot, JobWrite } from '../features/household-jobs/types'
export const jobsApi = shoppingApi.injectEndpoints({
  endpoints: (b) => ({
    getJobs: b.query<JobsSnapshot, number>({
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { meta } = await queryFulfilled
          // Cache upserts also fulfil this endpoint; only a real GET reconciles order.
          if (meta && 'authoritativeRead' in meta && meta.authoritativeRead === true)
            dispatch(jobsOrdersReconciled())
        } catch {
          /* Failed/aborted GETs deliberately keep the recovery guard. */
        }
      },
      async queryFn(ownerId, { signal }) {
        try {
          const data = await withRequestTimeout(
            (s) => request<JobsSnapshot>('/household-jobs', undefined, s),
            signal,
          )
          if (data.ownerId !== ownerId)
            throw new ApiError('Your account changed. Sign in again.', 401, 'account_changed')
          return { data, meta: { authoritativeRead: true } }
        } catch (e) {
          return { error: serializableError(e) }
        }
      },
    }),
    changeJob: b.mutation<JobsSnapshot, JobWrite>({
      async queryFn(w, { signal }) {
        try {
          return {
            data: await withRequestTimeout(
              (s) => writeRequest<JobsSnapshot>('/household-jobs/' + w.action, w.body, s),
              signal,
            ),
          }
        } catch (e) {
          return { error: serializableError(e) }
        }
      },
    }),
  }),
})
