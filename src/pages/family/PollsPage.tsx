import { useCollectionFilters } from '../../hooks/useCollectionFilters'
import { useUrlFilters } from '../../hooks/useUrlFilters'
import { pollStatuses, pollStatus, pollsView } from '../../features/polls/polls-view'
import { useNow } from '../../hooks/useNow'
import { isPollClosed } from '../../features/polls/poll-deadline'
import { useCollectionWindow } from '../../hooks/useCollectionWindow'
import { CollectionMore } from '../../components/ui/CollectionMore'
import { useEditingRecord } from '../../hooks/useEditingRecord'
import { pollActionPath } from '../../features/polls/poll-links'
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
export default function PollsPage() {
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
    void navigate(
      { pathname: '/polls', search: next.toString(), hash: location.hash },
      { replace: true },
    )
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
    void navigate(
      { pathname: '/polls', search: next.toString(), hash: location.hash },
      { replace: true },
    )
    clearError()
  }
  return (
    <div className="page-stack page-enter">
      <PageHeader
        title="Have a say"
        description="Shared questions, one vote each, and results everyone can see."
        action={
          <Link
            className="button-link"
            to={pollActionPath(location.search, location.hash, 'compose', 'poll')}
            onClick={clearError}
          >
            Create a poll
          </Link>
        }
      />
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
