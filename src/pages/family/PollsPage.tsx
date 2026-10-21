import { lazy, Suspense, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
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
  const user = useAppSelector((state) => state.auth.user)
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('open')
  useHashTarget(!loading)
  const manage = (id: string | null) =>
    polls.find(
      (poll) => poll.id === id && (user?.role === 'admin' || user?.id === poll.createdBy.id),
    )
  const editing = manage(params.get('edit')),
    removing = manage(params.get('remove'))
  const missing =
    !loading && !error && (params.has('edit') || params.has('remove')) && !editing && !removing
  const visible = polls.filter(
    (poll) =>
      (status === 'all' || (status === 'open' ? !poll.closed : poll.closed)) &&
      (poll.title + ' ' + poll.detail + ' ' + poll.createdBy.displayName)
        .toLocaleLowerCase()
        .includes(query.trim().toLocaleLowerCase()),
  )
  const close = () => {
    setParams({}, { replace: true })
    clearError()
  }
  return (
    <div className="page-stack page-enter">
      <PageHeader
        title="Have a say"
        description="Shared questions, one vote each, and results everyone can see."
        action={
          <Link className="button-link" to="?compose=poll" onClick={clearError}>
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
          hint="Search questions, details or who asked."
          query={query}
          sort={status}
          options={[
            ['open', 'Open for votes'],
            ['closed', 'Voting closed'],
            ['all', 'All polls'],
          ]}
          onQuery={setQuery}
          onSort={setStatus}
          onReset={() => {
            setQuery('')
            setStatus('open')
          }}
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
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <LoadingState label="Loading family polls…" />
      ) : visible.length ? (
        <div className="polls-page__grid">
          {visible.map((poll) => (
            <PollCard key={poll.id} poll={poll} />
          ))}
        </div>
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
                  setQuery('')
                  setStatus('all')
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
