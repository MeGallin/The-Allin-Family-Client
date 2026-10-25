import { request, ApiError } from './api-client'
import { writeRequest } from './write-request'
import { withRequestTimeout } from './request-timeout'
import { shoppingApi, serializableError } from './shopping-query'
import type {
  WordSnapshot,
  WordReceipt,
  WordWrite,
  WordResults,
} from '../features/daily-word/types'
export const dailyWordApi = shoppingApi.injectEndpoints({
  endpoints: (builder) => ({
    getDailyWord: builder.query<WordSnapshot, number>({
      async queryFn(ownerId, { signal }) {
        try {
          const data = await withRequestTimeout(
            (timed) => request<WordSnapshot>('/daily-word', undefined, timed),
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
      providesTags: (_, __, id) => [{ type: 'DailyWord', id }],
    }),
    getDailyWordResults: builder.query<WordResults, number>({
      async queryFn(_, { signal }) {
        try {
          return {
            data: await withRequestTimeout(
              (timed) => request<WordResults>('/daily-word/results', undefined, timed),
              signal,
            ),
          }
        } catch (error) {
          return { error: serializableError(error) }
        }
      },
      providesTags: ['DailyWordResults'],
    }),
    changeDailyWord: builder.mutation<WordReceipt, WordWrite>({
      async queryFn({ action, body }, { signal }) {
        try {
          return {
            data: await withRequestTimeout(
              (timed) => writeRequest<WordReceipt>('/daily-word/' + action, body, timed),
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
