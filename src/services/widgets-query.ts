import { shoppingApi, serializableError } from './shopping-query'
import { ApiError } from './api-client'
import { getWidgets, changeWidget } from './widgets-api'
import type { WidgetsSnapshot, WidgetWrite } from '../features/widgets/types'
export const widgetsApi = shoppingApi.injectEndpoints({
  endpoints: (builder) => ({
    getWidgets: builder.query<WidgetsSnapshot, number>({
      async queryFn(ownerId, { signal }) {
        try {
          const data = await getWidgets(signal)
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
      providesTags: (_, __, ownerId) => [{ type: 'Widgets', id: ownerId }],
    }),
    changeWidget: builder.mutation<WidgetsSnapshot, WidgetWrite>({
      async queryFn(write, { signal }) {
        try {
          return { data: await changeWidget(write, signal) }
        } catch (error) {
          return { error: serializableError(error) }
        }
      },
    }),
  }),
})
