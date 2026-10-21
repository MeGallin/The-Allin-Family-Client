import { profileApi } from './profile-query'
import { serializableError } from './shopping-query'
import { getAdminMembers } from './members-api'
import type { AdminMember } from '../features/members/types'
export const membersApi = profileApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminMembers: builder.query<{ members: AdminMember[] }, void>({
      async queryFn(_, { signal }) {
        try {
          return { data: await getAdminMembers(signal) }
        } catch (error) {
          return { error: serializableError(error) }
        }
      },
      providesTags: ['Profiles'],
    }),
  }),
})
