import { shoppingApi, serializableError } from './shopping-query'
import { request } from './api-client'
import { writeRequest } from './write-request'
import type { TravelPreferences, TravelSnapshot } from '../features/travel/types'
import type { RootState } from '../app/store'

export const travelApi = shoppingApi.injectEndpoints({
  endpoints: (builder) => ({
    getTravel: builder.query<TravelSnapshot, void>({
      async queryFn(_, { signal }) {
        try {
          return { data: await request<TravelSnapshot>('/travel', undefined, signal) }
        } catch (error) {
          return { error: serializableError(error) }
        }
      },
      providesTags: ['Travel'],
      keepUnusedDataFor: 30,
    }),
    getTravelPreferences: builder.query<TravelPreferences, void>({
      async queryFn(_, { signal }) {
        try {
          return {
            data: await request<TravelPreferences>(
              '/profile/travel-preferences',
              undefined,
              signal,
            ),
          }
        } catch (error) {
          return { error: serializableError(error) }
        }
      },
      providesTags: ['TravelPreferences'],
    }),
    saveTravelPreferences: builder.mutation<
      TravelPreferences,
      { lines: string[]; version: number }
    >({
      async queryFn(body, { signal }) {
        try {
          return {
            data: await writeRequest<TravelPreferences>(
              '/profile/travel-preferences',
              body,
              signal,
            ),
          }
        } catch (error) {
          return { error: serializableError(error) }
        }
      },
      invalidatesTags: (_, error) =>
        error
          ? error.status === 409
            ? ['TravelPreferences']
            : []
          : ['Travel', 'TravelPreferences', 'AdminActivity', 'AdminInsights'],
      async onQueryStarted(_, { dispatch, getState, queryFulfilled }) {
        const generation = (getState() as RootState).auth.generation
        dispatch(travelApi.util.getRunningQueryThunk('getTravelPreferences', undefined))?.abort()
        try {
          const { data } = await queryFulfilled
          if ((getState() as RootState).auth.generation !== generation) return
          await dispatch(travelApi.util.upsertQueryData('getTravelPreferences', undefined, data))
        } catch {
          /* Keep the form draft on failure. */
        }
      },
    }),
  }),
})
