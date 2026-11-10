import { shoppingApi, serializableError } from './shopping-query'
import { request, ApiError } from './api-client'
import { writeRequest } from './write-request'
import { withRequestTimeout } from './request-timeout'
import type { WhereSnapshot, WhereWrite } from '../features/where-is-it/types'

export const whereApi = shoppingApi.injectEndpoints({
  endpoints: (builder) => ({
    getWhereItems: builder.query<WhereSnapshot, number>({
      async queryFn(ownerId, { signal }) {
        try {
          const data = await withRequestTimeout(
            (timed) => request<WhereSnapshot>('/where-is-it', undefined, timed),
            signal,
            undefined,
            'Loading items timed out. Please try again.',
          )
          if (data.ownerId !== ownerId)
            throw new ApiError('Your account changed. Sign in again.', 401, 'account_changed')
          return { data }
        } catch (error) {
          return { error: serializableError(error) }
        }
      },
    }),
    changeWhereItem: builder.mutation<WhereSnapshot, WhereWrite>({
      async queryFn({ action, body, photo }, { signal }) {
        const form = new FormData()
        form.set('payload', JSON.stringify(body))
        if (photo) form.set('photo', photo)
        try {
          return {
            data: await withRequestTimeout(
              (timed) => writeRequest<WhereSnapshot>('/where-is-it/' + action, form, timed),
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
