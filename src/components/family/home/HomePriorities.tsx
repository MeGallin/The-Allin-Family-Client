import { Link } from 'react-router'
import { ArrowUpRight, ChartNoAxesColumn, ShoppingBasket } from 'lucide-react'
import { usePolls } from '../../../features/polls/usePolls'
import { useShopping } from '../../../features/shopping/useShopping'
import { homePolls } from '../../../features/family/home-view'
import { pollLink } from '../../../features/polls/poll-links'
import { useNow } from '../../../hooks/useNow'
import { PollTimeRemaining } from '../polls/PollTimeRemaining'
import { Icon } from '../../ui/Icon'
import { HomeDataError } from './HomeDataError'
import './HomePriorities.css'

export function HomePriorities() {
  const polls = usePolls()
  const shopping = useShopping()
  const { open, nextClosing, recentResult, awaitingVote } = homePolls(polls.polls, useNow())
  // Feature the soonest cutoff so the question and countdown always refer to one poll.
  const poll = nextClosing ?? recentResult
  const needed = shopping.items.filter((item) => !item.checked)
  const important = needed.filter((item) => item.important).length
  return (
    <section className="home-activity" aria-labelledby="home-activity-title">
      <h2 id="home-activity-title">Around the family</h2>
      <div className="home-priorities">
        <section
          id="family-poll"
          tabIndex={-1}
          aria-label="Family polls"
          className={'home-priority' + (open.length ? ' home-priority--live' : '')}
        >
          <HomeDataError error={polls.error} retry={polls.refresh} />
          <Link to={poll ? pollLink(poll) : '/polls'} className="home-priority__link">
            <span className="home-priority__label">
              <Icon icon={ChartNoAxesColumn} />
              {polls.loading
                ? 'Loading polls…'
                : polls.error
                  ? 'Family polls'
                  : open.length
                    ? `${open.length} live ${open.length === 1 ? 'poll' : 'polls'}`
                    : 'Family polls'}
              <Icon icon={ArrowUpRight} />
            </span>
            <strong className="home-priority__question">
              {poll?.title ??
                (polls.loading
                  ? 'A moment, please.'
                  : polls.error
                    ? 'Open polls to check'
                    : 'What shall we decide next?')}
            </strong>
            {!polls.loading && !polls.error && (
              <span className="home-priority__detail">
                {nextClosing ? (
                  <>
                    <PollTimeRemaining value={nextClosing.closesAt} />
                    <small>
                      {awaitingVote ? `${awaitingVote} awaiting your vote` : 'You’re all caught up'}{' '}
                      · Open poll
                    </small>
                  </>
                ) : (
                  <>
                    <span>{recentResult ? 'Voting closed' : 'No live polls right now'}</span>
                    <small>
                      {recentResult ? 'See the latest result' : 'Start a conversation in Polls'}
                    </small>
                  </>
                )}
              </span>
            )}
          </Link>
        </section>
        <section aria-label="Shopping summary" className="home-priority home-priority--shopping">
          <HomeDataError error={shopping.error} retry={shopping.refresh} />
          <Link to="/lists?show=needed" className="home-priority__link">
            <span className="home-priority__label">
              <Icon icon={ShoppingBasket} />
              Shopping list
              <Icon icon={ArrowUpRight} />
            </span>
            {shopping.loading || shopping.error ? (
              <strong className="home-priority__question">
                {shopping.loading ? 'Loading shopping…' : 'Open the list to check'}
              </strong>
            ) : (
              <>
                <span className="home-priority__metric">
                  <strong>{needed.length}</strong>
                  <span>{needed.length === 1 ? 'item to pick up' : 'items to pick up'}</span>
                </span>
                <span className="home-priority__shopping-meta">
                  {important ? (
                    <span className="home-priority__important">{important} important</span>
                  ) : (
                    <span>{needed.length ? 'Ready for the next shop' : 'All caught up'}</span>
                  )}
                  <span>Open list</span>
                </span>
              </>
            )}
          </Link>
        </section>
      </div>
    </section>
  )
}
