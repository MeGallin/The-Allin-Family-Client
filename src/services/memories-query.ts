import { shoppingApi, serializableError } from './shopping-query'
import { getMemories } from './memories-api'
import type { MemorySnapshot } from '../features/memories/types'

export const memoriesApi = shoppingApi.injectEndpoints({
  endpoints: (builder) => ({
    getMemories: builder.query<MemorySnapshot, void>({
      async queryFn(_, { signal }) {
        try {
          return { data: await getMemories(signal) }
        } catch (error) {
          return { error: serializableError(error) }
        }
      },
      providesTags: ['Memories'],
    }),
  }),
})
