import { PollTimeRemaining } from './PollTimeRemaining'
import { useNow } from '../../../hooks/useNow'
import { pollLink } from '../../../features/polls/poll-links'
import { builtinWidgetPath } from '../../../features/widgets/builtin-widgets'
import { Link } from 'react-router'
import { usePolls } from '../../../features/polls/usePolls'
import { homePolls } from '../../../features/family/home-view'
import { Panel } from '../../ui/Panel'
import { LoadingState } from '../../ui/LoadingState'
import { HomePollSummary } from './HomePollSummary'
import './FamilyPoll.css'
export function FamilyPoll() {
  const { polls, loading, pending, error, refresh } = usePolls()
  const { open, featured, recentResult, nextClosing, awaitingVote } = homePolls(polls, useNow())
  const poll = featured ?? recentResult
  return (
    <div id="family-poll" tabIndex={-1} className="family-poll">
      <Panel
        title="Polls"
        action={<Link to={poll ? pollLink(poll) : builtinWidgetPath('polls')}>View polls</Link>}
      >
        {!loading &&
          !error &&
          (open.length && nextClosing ? (
            <div className="family-poll__live">
              <div className="family-poll__live-heading">
                <span className="family-poll__live-label">Live</span>
                <strong>
                  {open.length} {open.length === 1 ? 'poll' : 'polls'} open
                </strong>
              </div>
              <Link className="family-poll__next" to={pollLink(nextClosing)}>
                <span>
                  Next closes<span className="sr-only">: {nextClosing.title}. </span>
                </span>
                <PollTimeRemaining value={nextClosing.closesAt} />
              </Link>
              <p>
                {awaitingVote
                  ? `${awaitingVote} ${awaitingVote === 1 ? 'question needs' : 'questions need'} your vote.`
                  : 'You’re up to date. Your votes are saved.'}
              </p>
            </div>
          ) : (
            <p className="note">No open polls right now.</p>
          ))}
        {loading ? (
          <LoadingState label="Loading family polls…" />
        ) : poll ? (
          <>
            {!featured && <p className="family-poll__result">Latest result · voting closed</p>}
            <HomePollSummary poll={poll} />
            {open.length > 1 && (
              <ul className="family-poll__others" aria-label="More open polls">
                {open.slice(1, 3).map((entry) => (
                  <li key={entry.id}>
                    <Link to={pollLink(entry)}>{entry.title}</Link>
                    <span>
                      <PollTimeRemaining value={entry.closesAt} /> · {entry.totalVotes}{' '}
                      {entry.totalVotes === 1 ? 'vote' : 'votes'}
                      {entry.ownOptionId ? ' · Your vote is saved' : ' · Have your say'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {open.length > 3 && (
              <p className="note">
                <Link to={builtinWidgetPath('polls')}>
                  See {open.length - 3} more open {open.length - 3 === 1 ? 'poll' : 'polls'}
                </Link>
              </p>
            )}
          </>
        ) : (
          !error && (
            <p className="family-poll__empty">Ask a question and let everyone have a say.</p>
          )
        )}
        {!loading && !error && !featured && (
          <Link className="button-link" to={builtinWidgetPath('polls', 'compose=poll')}>
            Create a poll
          </Link>
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
