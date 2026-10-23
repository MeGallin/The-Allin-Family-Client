import { shoppingApi, serializableError } from './shopping-query'
import { request } from './api-client'
import type { FoodAlertsFeed } from '../features/food-alerts/types'

export const foodAlertsApi = shoppingApi.injectEndpoints({
  endpoints: (builder) => ({
    getFoodAlerts: builder.query<FoodAlertsFeed, void>({
      async queryFn(_, { signal }) {
        try {
          return { data: await request<FoodAlertsFeed>('/food-alerts', undefined, signal) }
        } catch (error) {
          return { error: serializableError(error) }
        }
      },
      keepUnusedDataFor: 1800,
    }),
  }),
})
