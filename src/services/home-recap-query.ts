import { ApiError, request } from './api-client'
import { writeRequest } from './write-request'
import { withRequestTimeout } from './request-timeout'
import { shoppingApi, serializableError } from './shopping-query'

export type HomeRecapItem = {
  id: string
  source: 'calendar' | 'shopping'
  recordId: string
  title: string
  change: string
  actor: string
  occurredAt: string
  removed: boolean
  startsAt?: string
  allDay?: boolean
}
type HomeRecapSnapshot = { ownerId: number; throughId: string; items: HomeRecapItem[] }

// Reuse the shared authenticated cache, including its reset on account changes/sign-out.
export const homeRecapApi = shoppingApi.injectEndpoints({
  endpoints: (builder) => ({
    getHomeRecap: builder.query<HomeRecapSnapshot, number>({
      async queryFn(ownerId, { signal }) {
        try {
          const data = await withRequestTimeout(
            (timed) => request<HomeRecapSnapshot>('/home-recap', undefined, timed),
            signal,
            15_000,
            'Your updates are taking longer than expected. Please try again.',
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
      providesTags: ['HomeRecap', 'Calendar', 'Shopping', 'Profiles'],
    }),
    reviewHomeRecap: builder.mutation<{ reviewed: boolean }, { throughId: string }>({
      async queryFn(body, { signal }) {
        try {
          return {
            data: await withRequestTimeout(
              (timed) => writeRequest<{ reviewed: boolean }>('/home-recap/review', body, timed),
              signal,
            ),
          }
        } catch (error) {
          return { error: serializableError(error) }
        }
      },
      invalidatesTags: ['HomeRecap'],
    }),
  }),
})
