import { shoppingApi, serializableError } from './shopping-query'
import { getAdminUsage } from './usage-api'
import type { UsageFilters, UsageSnapshot } from '../features/usage/types'

export const usageApi = shoppingApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminUsage: builder.query<UsageSnapshot, UsageFilters>({
      async queryFn(filters, { signal }) {
        try {
          return { data: await getAdminUsage(filters, signal) }
        } catch (error) {
          return { error: serializableError(error) }
        }
      },
      providesTags: ['AdminUsage'],
    }),
  }),
})
