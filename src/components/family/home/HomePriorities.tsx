import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ArrowUpRight } from 'lucide-react'
import { usePolls } from '../../../features/polls/usePolls'
import { useShopping } from '../../../features/shopping/useShopping'
import { homePolls } from '../../../features/family/home-view'
import { pollLink } from '../../../features/polls/poll-links'
import { useNow } from '../../../hooks/useNow'
import { PollTimeRemaining } from '../polls/PollTimeRemaining'
import { Icon } from '../../ui/Icon'
import { WidgetAppIcon } from '../../widgets/WidgetStoreArt'
import { HomeDataError } from './HomeDataError'
import { HomeDinnerSummary } from './HomeDinnerSummary'
import { builtinWidgetPath } from '../../../features/widgets/builtin-widgets'
import './HomePriorities.css'

export function HomePriorities({ children }: { children?: ReactNode }) {
  const polls = usePolls()
  const shopping = useShopping()
  const { open, nextClosing, recentResult, awaitingVote } = homePolls(polls.polls, useNow())
  // Feature the soonest cutoff so the question and countdown always refer to one poll.
  const poll = nextClosing ?? recentResult
  const needed = shopping.items.filter((item) => !item.checked)
  const important = needed.filter((item) => item.important).length
  return (
    <section className="home-activity" aria-labelledby="home-activity-title">
      <header className="home-activity__heading">
        <h2 id="home-activity-title">Around the family</h2>
        <p>The useful bits of home, gathered in one place.</p>
      </header>
      <div className="home-family-index">
        <HomeDinnerSummary />
        <div className="home-destination-grid">
          <section
            id="family-poll"
            tabIndex={-1}
            aria-label="Family polls"
            className="home-index-item"
          >
            <HomeDataError error={polls.error} retry={polls.refresh} />
            <Link
              to={poll ? pollLink(poll) : builtinWidgetPath('polls')}
              className="home-index-row"
            >
              <WidgetAppIcon id="polls" compact />
              <span className="home-index-row__label">
                <strong>Family polls</strong>
                <small>Decisions for everyone</small>
              </span>
              <span className="home-index-row__status">
                {polls.loading || polls.error ? (
                  <strong>{polls.loading ? 'Loading polls…' : 'Open polls to check'}</strong>
                ) : (
                  <span className="home-index-row__metrics">
                    <span>
                      <small>Live {open.length === 1 ? 'poll' : 'polls'}</small>
                      <strong className="home-index-row__count">{open.length}</strong>
                    </span>
                  </span>
                )}
                {!polls.loading && !polls.error && (
                  <>
                    <span className="home-index-row__title">
                      {poll?.title ?? 'No live polls right now'}
                    </span>
                    {nextClosing ? (
                      <span>
                        <PollTimeRemaining value={nextClosing.closesAt} /> ·{' '}
                        {awaitingVote
                          ? `${awaitingVote} awaiting your vote`
                          : 'You’re all caught up'}
                      </span>
                    ) : (
                      <span>
                        {recentResult
                          ? 'Voting closed · See the latest result'
                          : 'Start a conversation in Polls'}
                      </span>
                    )}
                  </>
                )}
              </span>
              <span className="home-index-row__action">
                Open <Icon icon={ArrowUpRight} />
              </span>
            </Link>
          </section>
          <section aria-label="Shopping summary" className="home-index-item">
            <HomeDataError error={shopping.error} retry={shopping.refresh} />
            <Link to={builtinWidgetPath('shopping', 'show=needed')} className="home-index-row">
              <WidgetAppIcon id="shopping" compact />
              <span className="home-index-row__label">
                <strong>Shopping list</strong>
                <small>Shared things to pick up</small>
              </span>
              <span className="home-index-row__status">
                {shopping.loading || shopping.error ? (
                  <strong>
                    {shopping.loading ? 'Loading shopping…' : 'Open the list to check'}
                  </strong>
                ) : (
                  <>
                    <span className="home-index-row__metrics">
                      <span>
                        <small>
                          {needed.length === 1 ? 'Item to pick up' : 'Items to pick up'}
                        </small>
                        <strong className="home-index-row__count">{needed.length}</strong>
                      </span>
                      {important > 0 && (
                        <span>
                          <small className="home-index-row__important">Important</small>
                          <strong className="home-index-row__count">{important}</strong>
                        </span>
                      )}
                    </span>
                    {!important && (
                      <span>{needed.length ? 'Ready for the next shop' : 'All caught up'}</span>
                    )}
                  </>
                )}
              </span>
              <span className="home-index-row__action">
                Open <Icon icon={ArrowUpRight} />
              </span>
            </Link>
          </section>
          {children}
        </div>
      </div>
    </section>
  )
}
