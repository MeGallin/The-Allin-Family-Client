import { executeWrite } from '../../app/execute-write'
import type { AppDispatch, RootState } from '../../app/store'
import { userReceived } from '../auth/auth-slice'
import { membersApi } from '../../services/members-query'
import { profileInvalidationTags } from '../../services/profile-query'
import { writeAdminMember } from '../../services/members-api'
import { memberWriteStarted, memberWriteFinished, memberWriteFailed } from './members-ui-slice'
import type { MemberResponse, MemberWrite } from './types'

// The one-time credential stays in the returned promise and mounted UI only.
// It must never pass through Redux actions, mutation caches or browser storage.
export const executeMemberWrite =
  (write: MemberWrite) =>
  async (dispatch: AppDispatch, getState: () => RootState): Promise<MemberResponse | null> => {
    let result: MemberResponse | null = null
    const saved = await executeWrite(dispatch, getState, {
      busy: (state) => state.membersUi.busy,
      start: () => {
        dispatch(memberWriteStarted())
        dispatch(membersApi.util.getRunningQueryThunk('getProfile', undefined))?.abort()
      },
      request: () => writeAdminMember(write),
      commit: async (data) => {
        dispatch(userReceived(data.self))
        await dispatch(
          membersApi.util.upsertQueryData('getProfile', undefined, { profile: data.self }),
        )
        dispatch(membersApi.util.invalidateTags([...profileInvalidationTags]))
        result = data
      },
      refresh: () =>
        dispatch(
          membersApi.endpoints.getAdminMembers.initiate(undefined, {
            subscribe: false,
            forceRefetch: true,
          }),
        ),
      failed: (error) => {
        dispatch(memberWriteFailed(error))
      },
      finish: () => {
        dispatch(memberWriteFinished())
      },
    })
    return saved ? result : null
  }
