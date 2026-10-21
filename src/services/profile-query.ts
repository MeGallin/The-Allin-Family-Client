import { shoppingApi, serializableError } from './shopping-query'
import {
  changeNickname,
  getProfile,
  getAdminUsers,
  type NicknameChange,
  type NicknameResponse,
  type ProfileResponse,
} from './profile-api'
import { userReceived } from '../features/auth/auth-slice'
import type { FamilyUser } from '../types/auth'
import type { RootState } from '../app/store'

// Extend the existing API cache/middleware rather than creating a second API store.
export const profileApi = shoppingApi.injectEndpoints({
  endpoints: (builder) => ({
    getProfile: builder.query<ProfileResponse, void>({
      async queryFn(_, { signal }) {
        try {
          return { data: await getProfile(signal) }
        } catch (error) {
          return { error: serializableError(error) }
        }
      },
      providesTags: ['Profiles'],
    }),
    getAdminUsers: builder.query<{ users: FamilyUser[] }, void>({
      async queryFn(_, { signal }) {
        try {
          return { data: await getAdminUsers(signal) }
        } catch (error) {
          return { error: serializableError(error) }
        }
      },
      providesTags: ['Profiles'],
    }),
    changeNickname: builder.mutation<NicknameResponse, NicknameChange>({
      async queryFn(body) {
        try {
          return { data: await changeNickname(body) }
        } catch (error) {
          return { error: serializableError(error) }
        }
      },
      invalidatesTags: (_, error) => (error?.status === 409 ? ['Profiles'] : []),
      async onQueryStarted(_, { dispatch, getState, queryFulfilled }) {
        const generation = (getState() as RootState).auth.generation
        dispatch(profileApi.util.getRunningQueryThunk('getProfile', undefined))?.abort()
        try {
          const { data } = await queryFulfilled
          if ((getState() as RootState).auth.generation !== generation) return
          dispatch(userReceived(data.self))
          await dispatch(
            profileApi.util.upsertQueryData('getProfile', undefined, { profile: data.self }),
          )
          dispatch(profileApi.util.invalidateTags(['Profiles', 'Shopping', 'Calendar']))
        } catch {
          /* The form displays the mutation error and retains the draft. */
        }
      },
    }),
  }),
})
