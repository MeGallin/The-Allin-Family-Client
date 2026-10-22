import { useAppDispatch, useAppSelector } from '../../app/store-hooks'
import { useRemovals } from '../removals/useRemovals'
import { pollsApi } from '../../services/polls-query'
import { shoppingError } from '../../services/shopping-query'
import { executePollWrite } from './polls-actions'
import type { PollDraft, FamilyPollRecord } from './types'
export function usePolls() {
  const dispatch = useAppDispatch()
  const removal = useRemovals('polls')
  const query = pollsApi.endpoints.getPolls.useQueryState(undefined)
  const [, mutation] = pollsApi.useChangePollMutation({ fixedCacheKey: 'shared-poll-write' })
  const ui = useAppSelector((state) => state.pollsUi)
  const failure = shoppingError(mutation.error) ?? shoppingError(query.error)
  return {
    polls: query.data?.polls ?? [],
    loading: !query.data && (query.isLoading || query.isUninitialized),
    pending: ui.busy,
    feedback: ui.feedback,
    failure,
    error: failure?.message ?? '',
    clearError: mutation.reset,
    refresh: () => {
      mutation.reset()
      void dispatch(
        pollsApi.endpoints.getPolls.initiate(undefined, { subscribe: false, forceRefetch: true }),
      )
    },
    add: (draft: PollDraft, requestKey: string) =>
      dispatch(executePollWrite({ action: 'add', body: { ...draft, requestKey } })),
    edit: (
      poll: FamilyPollRecord,
      draft: Pick<PollDraft, 'title' | 'detail' | 'closesAt' | 'reopen'>,
    ) =>
      dispatch(
        executePollWrite({
          action: 'edit',
          body: { ...draft, id: poll.id, version: poll.version },
        }),
      ),
    vote: (poll: FamilyPollRecord, optionId: string | null) =>
      dispatch(
        executePollWrite({
          action: 'vote',
          body: { id: poll.id, version: poll.version, voteVersion: poll.voteVersion, optionId },
        }),
      ),
    close: (poll: FamilyPollRecord) =>
      dispatch(
        executePollWrite({
          action: 'close',
          body: { id: poll.id, version: poll.version, closed: true },
        }),
      ),
    ...removal,
  }
}
