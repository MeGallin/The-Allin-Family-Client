import { shoppingApi, serializableError } from './shopping-query'
import { request } from './api-client'
import type { InsightSnapshot } from '../features/insights/types'

export const insightsApi = shoppingApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminInsights: builder.query<InsightSnapshot, string>({
      async queryFn(days, { signal }) {
        try {
          return {
            data: await request<InsightSnapshot>(
              '/admin/insights?days=' + encodeURIComponent(days),
              undefined,
              signal,
            ),
          }
        } catch (error) {
          return { error: serializableError(error) }
        }
      },
      providesTags: ['AdminInsights'],
    }),
  }),
})
