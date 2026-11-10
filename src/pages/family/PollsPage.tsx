import { ContentSurface } from '../../components/ui/ContentSurface'
import { WidgetHelp } from '../../components/ui/WidgetHelp'
import { useCollectionFilters } from '../../hooks/useCollectionFilters'
import { useUrlFilters } from '../../hooks/useUrlFilters'
import { pollStatuses, pollStatus, pollsView } from '../../features/polls/polls-view'
import { useNow } from '../../hooks/useNow'
import { isPollClosed } from '../../features/polls/poll-deadline'
import { useCollectionWindow } from '../../hooks/useCollectionWindow'
import { CollectionMore } from '../../components/ui/CollectionMore'
import { useEditingRecord } from '../../hooks/useEditingRecord'
import { pollActionPath } from '../../features/polls/poll-links'
import { builtinWidgetPath } from '../../features/widgets/builtin-widgets'
import { lazy, Suspense, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { Vote } from 'lucide-react'
import { usePolls } from '../../features/polls/usePolls'
import { useAppSelector } from '../../app/store-hooks'
import { useHashTarget } from '../../hooks/useHashTarget'
import { PageHeader } from '../../components/ui/PageHeader'
import { CollectionToolbar } from '../../components/ui/CollectionToolbar'
import { ViewControls } from '../../components/ui/ViewControls'
import { EmptyState } from '../../components/ui/EmptyState'
import { LoadingState } from '../../components/ui/LoadingState'
import { PollCard } from '../../components/family/polls/PollCard'
import './PollsPage.css'
const PollComposer = lazy(() => import('../../components/family/polls/PollComposer'))
const PollRemoval = lazy(() => import('../../components/family/polls/PollRemoval'))
export default function PollsPage({ embedded = false }: { embedded?: boolean }) {
  const { polls, loading, pending, error, feedback, refresh, clearError } = usePolls()
  const now = useNow()
  const user = useAppSelector((state) => state.auth.user)
  const { params, update } = useUrlFilters()
  const location = useLocation()
  const navigate = useNavigate()
  const {
    query,
    sort: status,
    setQuery,
    setSort,
    reset,
  } = useCollectionFilters({ sort: pollStatus, sortKey: 'show' })
  const editablePolls = polls.filter(
    (poll) => user?.role === 'admin' || user?.id === poll.createdBy.id,
  )
  const editing = useEditingRecord(editablePolls, params.get('edit'))
  const removing = editablePolls.find((poll) => poll.id === params.get('remove'))
  const missing =
    !loading && !error && (params.has('edit') || params.has('remove')) && !editing && !removing
  const visible = pollsView(polls, query, status, now)
  const requestedId = /^#poll-(\d+)$/.exec(location.hash)?.[1]
  const collection = useCollectionWindow(visible, {
    viewKey: status + ':' + query,
    targetId: requestedId,
  })
  const requested = polls.find((poll) => poll.id === requestedId)
  const targetVisible = !requestedId || visible.some((poll) => poll.id === requestedId)
  const composing = params.get('compose') === 'poll'
  useHashTarget(!loading && targetVisible && !composing && !editing && !removing)
  useEffect(() => {
    if (loading || !requested || targetVisible || composing || editing || removing) return
    const next = new URLSearchParams(params)
    next.delete('q')
    next.set('show', isPollClosed(requested, now) ? 'closed' : 'open')
    void navigate(builtinWidgetPath('polls', next.toString(), location.hash), { replace: true })
  }, [
    loading,
    now,
    requested,
    targetVisible,
    composing,
    editing,
    removing,
    params,
    location.hash,
    navigate,
  ])
  const close = () => {
    const next = new URLSearchParams(params)
    for (const key of ['compose', 'edit', 'remove']) next.delete(key)
    void navigate(builtinWidgetPath('polls', next.toString(), location.hash), { replace: true })
    clearError()
  }
  const create = (
    <Link
      className="button-link"
      to={pollActionPath(location.search, location.hash, 'compose', 'poll')}
      onClick={clearError}
    >
      Create a poll
    </Link>
  )
  return (
    <div className="page-stack page-enter">
      {embedded ? (
        <div className="actions">{create}</div>
      ) : (
        <PageHeader
          title="Have a say"
          description="Shared questions, one vote each, and results everyone can see."
          action={create}
        />
      )}
      <ContentSurface>
        <WidgetHelp>
          <p>Ask the family a question, give everyone one vote and see the shared totals.</p>
          <ol>
            <li>
              <strong>Create a question.</strong> Choose Create a poll, enter the question, optional
              details and two to six distinct answer choices, then set a future closing time. Choose
              Share poll to publish it to the family. An unfinished form is not a saved poll.
            </li>
            <li>
              <strong>Cast your vote.</strong> In an open poll, choose one answer. Your vote saves
              immediately and the selected option shows Your choice. Each person has one vote per
              poll; choosing another answer moves that vote rather than adding a second one.
            </li>
            <li>
              <strong>Change your mind while voting is open.</strong> Select another option or
              choose Withdraw my vote. Once voting closes, the final totals remain visible but votes
              cannot be changed. Voting closes at its scheduled cutoff or when its creator or an
              administrator chooses Close voting.
            </li>
            <li>
              <strong>Find earlier decisions.</strong> Use Show to select open, closed or all polls,
              and search questions, details or who added/edited them. A poll may leave the current
              filtered view after closing; change the filters to find its result.
            </li>
            <li>
              <strong>Manage your question.</strong> The creator and administrators can Edit poll or
              Remove poll. Reopen voting opens the edit form so you can choose a future cutoff and
              save. Existing answer choices are kept when editing, protecting saved votes. Removal
              asks for confirmation and offers 20 seconds of Undo before it takes effect.
            </li>
          </ol>
          <p>
            Polls and totals are shared. Administrators can see voting activity, including who voted
            or changed a choice; voting is not anonymous. Wait for saving feedback and review any
            error or changed-record warning before retrying. Refresh polls checks saved data; it
            does not submit an unfinished form.
          </p>
        </WidgetHelp>
        {polls.length > 0 && (
          <ViewControls
            label="Poll filters"
            sortLabel="Show"
            queryLabel="Question or name"
            placeholder="Find a family poll"
            hint="Search questions, details or who added/edited them."
            query={query}
            sort={status}
            options={pollStatuses}
            onQuery={setQuery}
            onSort={setSort}
            onReset={reset}
            active={!!query || status !== 'open'}
            count={visible.length}
            total={polls.length}
            noun="poll"
          />
        )}
        <CollectionToolbar
          label="Refresh polls"
          busy={pending}
          feedback={pending ? 'Saving…' : feedback}
          onRefresh={refresh}
        >
          <p className="note">
            Each person has one vote per poll. Administrators can see who voted or changed a vote.
          </p>
        </CollectionToolbar>
        {!loading && !error && requestedId && !requested && (
          <div className="feedback" role="status">
            <p>The linked poll is no longer available.</p>
            <button
              type="button"
              className="secondary"
              onClick={() => update({ q: '', show: 'all' }, { clearHash: true })}
            >
              Show available polls
            </button>
          </div>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {loading ? (
          <LoadingState label="Loading family polls…" />
        ) : visible.length ? (
          <>
            <div className="polls-page__grid">
              {collection.items.map((poll) => (
                <PollCard key={poll.id} poll={poll} />
              ))}
            </div>
            <CollectionMore {...collection} label="polls" />
          </>
        ) : (
          !error && (
            <EmptyState
              icon={Vote}
              title={polls.length ? 'No matching polls' : 'What shall we decide together?'}
            >
              <p>
                {polls.length
                  ? 'Change the filters to see other polls.'
                  : 'Create the first poll and invite the family to vote.'}
              </p>
              {polls.length > 0 && (
                <button
                  type="button"
                  className="secondary"
                  onClick={() => {
                    update({ q: '', show: 'all' }, { clearHash: true })
                    document.getElementById('family-content')?.focus()
                  }}
                >
                  Show all polls
                </button>
              )}
            </EmptyState>
          )
        )}
      </ContentSurface>
      {missing && (
        <div role="status">
          <p>This poll is unavailable or you cannot manage it.</p>
          <button type="button" className="secondary" onClick={close}>
            Back to polls
          </button>
        </div>
      )}
      {(params.get('compose') === 'poll' || editing) && (
        <Suspense fallback={<LoadingState label="Opening the poll form…" />}>
          <PollComposer key={editing?.id ?? 'new'} poll={editing} onClose={close} />
        </Suspense>
      )}
      {removing && (
        <Suspense fallback={<LoadingState label="Opening poll options…" />}>
          <PollRemoval poll={removing} onClose={close} />
        </Suspense>
      )}
    </div>
  )
}
