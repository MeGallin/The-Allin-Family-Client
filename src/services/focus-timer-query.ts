import { request, ApiError } from './api-client'
import { writeRequest } from './write-request'
import { withRequestTimeout } from './request-timeout'
import { shoppingApi, serializableError } from './shopping-query'
import type { FocusSnapshot, FocusReceipt, FocusWrite } from '../features/focus-timer/types'
export const focusTimerApi = shoppingApi.injectEndpoints({
  endpoints: (builder) => ({
    getFocusTimer: builder.query<FocusSnapshot, number>({
      async queryFn(ownerId, { signal }) {
        try {
          const data = await withRequestTimeout(
            (timed) => request<FocusSnapshot>('/focus-timer', undefined, timed),
            signal,
          )
          if (data.ownerId !== ownerId)
            throw new ApiError(
              'Your account changed. Please sign in again.',
              401,
              'account_changed',
            )
          return { data }
        } catch (error) {
          return { error: serializableError(error) }
        }
      },
      providesTags: (_, __, id) => [{ type: 'FocusTimer', id }],
    }),
    changeFocusTimer: builder.mutation<FocusReceipt, FocusWrite>({
      async queryFn({ action, body }, { signal }) {
        try {
          return {
            data: await withRequestTimeout(
              (timed) => writeRequest<FocusReceipt>('/focus-timer/' + action, body, timed),
              signal,
            ),
          }
        } catch (error) {
          return { error: serializableError(error) }
        }
      },
    }),
  }),
})
