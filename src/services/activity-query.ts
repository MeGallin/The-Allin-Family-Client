import { shoppingApi, serializableError } from './shopping-query'
import { getAdminActivity } from './activity-api'
import type { ActivityFilters, ActivitySnapshot } from '../features/activity/types'
export const activityApi = shoppingApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminActivity: builder.query<ActivitySnapshot, ActivityFilters>({
      async queryFn(filters, { signal }) {
        try {
          return { data: await getAdminActivity(filters, signal) }
        } catch (error) {
          return { error: serializableError(error) }
        }
      },
      providesTags: ['AdminActivity'],
    }),
  }),
})
