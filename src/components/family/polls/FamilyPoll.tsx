import { Link } from 'react-router'
import { usePolls } from '../../../features/polls/usePolls'
import { Panel } from '../../ui/Panel'
import { LoadingState } from '../../ui/LoadingState'
import { PollCard } from './PollCard'
import './FamilyPoll.css'
export function FamilyPoll() {
  const { polls, loading, pending, feedback, error, refresh } = usePolls()
  const poll = polls.find((entry) => !entry.closed) ?? polls[0]
  return (
    <div id="family-poll" className="family-poll">
      <Panel title="Have a say" action={<Link to="/polls">All polls</Link>}>
        {loading ? (
          <LoadingState label="Loading family polls…" />
        ) : poll ? (
          <PollCard poll={poll} preview />
        ) : (
          <>
            <p className="note">Ask a question, share a few choices and let everyone have a say.</p>
            <Link className="button-link" to="/polls?compose=poll">
              Create a poll
            </Link>
          </>
        )}
        {pending && (
          <p role="status" className="note">
            Saving…
          </p>
        )}
        {feedback && (
          <p role="status" className="note">
            {feedback}
          </p>
        )}
        {error && (
          <div>
            <p role="alert" className="error">
              {error}
            </p>
            <button type="button" className="secondary" disabled={pending} onClick={refresh}>
              Try again
            </button>
          </div>
        )}
      </Panel>
    </div>
  )
}
