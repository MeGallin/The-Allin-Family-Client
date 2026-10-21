import { shoppingApi, serializableError } from './shopping-query'
import { getPolls, changePoll } from './polls-api'
import type { PollSnapshot, PollWrite } from '../features/polls/types'
export const pollsApi = shoppingApi.injectEndpoints({
  endpoints: (builder) => ({
    getPolls: builder.query<PollSnapshot, void>({
      async queryFn(_, { signal }) {
        try {
          return { data: await getPolls(signal) }
        } catch (error) {
          return { error: serializableError(error) }
        }
      },
      providesTags: ['Polls'],
    }),
    changePoll: builder.mutation<PollSnapshot, PollWrite>({
      async queryFn(write, { signal }) {
        try {
          return { data: await changePoll(write, signal) }
        } catch (error) {
          return { error: serializableError(error) }
        }
      },
    }),
  }),
})
