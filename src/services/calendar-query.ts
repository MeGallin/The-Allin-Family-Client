import { shoppingApi, serializableError } from './shopping-query'
import { getCalendar, changeCalendar } from './calendar-api'
import type { CalendarSnapshot } from '../features/calendar/types'

export type CalendarWrite = { action: 'add' | 'edit' | 'remove'; body: object }
// Share the API reducer and middleware, including private cache reset on sign-out.
export const calendarApi = shoppingApi.injectEndpoints({
  endpoints: (builder) => ({
    getCalendar: builder.query<CalendarSnapshot, void>({
      async queryFn(_, { signal }) {
        try {
          return { data: await getCalendar(signal) }
        } catch (error) {
          return { error: serializableError(error) }
        }
      },
      providesTags: ['Calendar'],
    }),
    changeCalendar: builder.mutation<CalendarSnapshot, CalendarWrite>({
      async queryFn({ action, body }, { signal }) {
        try {
          return { data: await changeCalendar(action, body, signal) }
        } catch (error) {
          return { error: serializableError(error) }
        }
      },
      invalidatesTags: (_, error) => (error?.status === 409 ? ['Calendar'] : []),
    }),
  }),
})
