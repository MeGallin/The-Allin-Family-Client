import { request, ApiError } from './api-client'
import { writeRequest } from './write-request'
import { withRequestTimeout } from './request-timeout'
import { shoppingApi, serializableError } from './shopping-query'
import type { NonogramSnapshot, NonogramWrite } from '../features/nonograms/types'
export const nonogramApi = shoppingApi.injectEndpoints({
  endpoints: (builder) => ({
    getNonogram: builder.query<NonogramSnapshot, number>({
      async queryFn(ownerId, { signal }) {
        try {
          const data = await withRequestTimeout(
            (timed) => request<NonogramSnapshot>('/nonograms', undefined, timed),
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
      // Installation revisions survive removal/reinstall; apply this to reads and upserts alike.
      merge(current, incoming) {
        if (
          incoming.ownerId !== current.ownerId ||
          incoming.installationVersion < current.installationVersion
        )
          return current
        return incoming
      },
      providesTags: (_, __, ownerId) => [{ type: 'Nonograms', id: ownerId }],
    }),
    changeNonogram: builder.mutation<NonogramSnapshot, NonogramWrite>({
      async queryFn({ action, body }, { signal }) {
        try {
          return {
            data: await withRequestTimeout(
              (timed) => writeRequest<NonogramSnapshot>('/nonograms/' + action, body, timed),
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
