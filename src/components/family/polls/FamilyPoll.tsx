import { pollLink } from '../../../features/polls/poll-links'
import { Link } from 'react-router'
import { usePolls } from '../../../features/polls/usePolls'
import { homePolls } from '../../../features/family/home-view'
import { Panel } from '../../ui/Panel'
import { LoadingState } from '../../ui/LoadingState'
import { PollCard } from './PollCard'
import './FamilyPoll.css'
export function FamilyPoll() {
  const { polls, loading, pending, feedback, error, refresh } = usePolls()
  const { open, featured, recentResult } = homePolls(polls)
  const poll = featured ?? recentResult
  return (
    <div id="family-poll" tabIndex={-1} className="family-poll">
      <Panel
        title="Have a say"
        action={<Link to={poll ? pollLink(poll) : '/polls'}>View polls</Link>}
      >
        {!loading && !error && (
          <p className="note">
            {open.length
              ? `${open.length} ${open.length === 1 ? 'question is' : 'questions are'} open for votes.`
              : 'No open polls right now.'}
          </p>
        )}
        {loading ? (
          <LoadingState label="Loading family polls…" />
        ) : poll ? (
          <>
            {!featured && <p className="family-poll__result">Latest result · voting closed</p>}
            <PollCard poll={poll} preview />
            {open.length > 1 && (
              <ul className="family-poll__others" aria-label="More open polls">
                {open.slice(1, 3).map((entry) => (
                  <li key={entry.id}>
                    <Link to={pollLink(entry)}>{entry.title}</Link>
                    <span>
                      {entry.totalVotes} {entry.totalVotes === 1 ? 'vote' : 'votes'}
                      {entry.ownOptionId ? ' · Your vote is saved' : ' · Have your say'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {open.length > 3 && (
              <p className="note">
                <Link to="/polls">
                  See {open.length - 3} more open {open.length - 3 === 1 ? 'poll' : 'polls'}
                </Link>
              </p>
            )}
          </>
        ) : (
          !error && (
            <p className="note">Ask a question, share a few choices and let everyone have a say.</p>
          )
        )}
        {!loading && !error && !featured && (
          <Link className="button-link" to="/polls?compose=poll">
            Create a poll
          </Link>
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
