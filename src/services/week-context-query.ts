import { shoppingApi, serializableError } from './shopping-query'
import { request } from './api-client'
import { writeRequest } from './write-request'
import type {
  WeekContext,
  WeekPreferences,
  WeekPreferenceChange,
  TownChoice,
} from '../features/week-context/types'
import type { RootState } from '../app/store'
import type { WeatherWarningsFeed } from '../features/weather-warnings/types'

export const weekContextApi = shoppingApi.injectEndpoints({
  endpoints: (builder) => ({
    getWeatherWarnings: builder.query<WeatherWarningsFeed, void>({
      async queryFn(_, { signal }) {
        try {
          return {
            data: await request<WeatherWarningsFeed>('/weather-warnings', undefined, signal),
          }
        } catch (error) {
          return { error: serializableError(error) }
        }
      },
      keepUnusedDataFor: 300,
      providesTags: ['WeekContext'],
    }),
    getWeekContext: builder.query<WeekContext, void>({
      async queryFn(_, { signal }) {
        try {
          return { data: await request<WeekContext>('/week-context', undefined, signal) }
        } catch (error) {
          return { error: serializableError(error) }
        }
      },
      keepUnusedDataFor: 1800,
      providesTags: ['WeekContext'],
    }),
    getWeekPreferences: builder.query<WeekPreferences, void>({
      async queryFn(_, { signal }) {
        try {
          return {
            data: await request<WeekPreferences>('/profile/week-preferences', undefined, signal),
          }
        } catch (error) {
          return { error: serializableError(error) }
        }
      },
      providesTags: ['WeekPreferences'],
    }),
    searchWeekTowns: builder.query<{ towns: TownChoice[] }, string>({
      async queryFn(term, { signal }) {
        try {
          return {
            data: await request<{ towns: TownChoice[] }>(
              '/week-context/towns?q=' + encodeURIComponent(term),
              undefined,
              signal,
            ),
          }
        } catch (error) {
          return { error: serializableError(error) }
        }
      },
      keepUnusedDataFor: 0,
    }),
    saveWeekPreferences: builder.mutation<WeekPreferences, WeekPreferenceChange>({
      async queryFn(body, { signal }) {
        try {
          return {
            data: await writeRequest<WeekPreferences>('/profile/week-preferences', body, signal),
          }
        } catch (error) {
          return { error: serializableError(error) }
        }
      },
      invalidatesTags: (_, error) =>
        error
          ? error.status === 409
            ? ['WeekPreferences']
            : []
          : ['WeekContext', 'WeekPreferences', 'AdminActivity', 'AdminInsights'],
      async onQueryStarted(_, { dispatch, getState, queryFulfilled }) {
        const generation = (getState() as RootState).auth.generation
        dispatch(weekContextApi.util.getRunningQueryThunk('getWeekPreferences', undefined))?.abort()
        try {
          const { data } = await queryFulfilled
          if ((getState() as RootState).auth.generation !== generation) return
          await dispatch(weekContextApi.util.upsertQueryData('getWeekPreferences', undefined, data))
        } catch {
          /* The form retains its draft and displays the error. */
        }
      },
    }),
  }),
})
