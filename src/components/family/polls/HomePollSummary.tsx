import { useId } from 'react'
import { Link } from 'react-router'
import { ArrowUpRight } from 'lucide-react'
import { Icon } from '../../ui/Icon'
import { useNow } from '../../../hooks/useNow'
import { isPollClosed } from '../../../features/polls/poll-deadline'
import { pollLink } from '../../../features/polls/poll-links'
import type { FamilyPollRecord } from '../../../features/polls/types'
import { PollTimeRemaining } from './PollTimeRemaining'
import './HomePollSummary.css'
/** Home is a read-only brief. Voting and management belong on the poll route. */
export function HomePollSummary({ poll }: { poll: FamilyPollRecord }) {
  const id = useId()
  const closed = isPollClosed(poll, useNow())
  const choice = poll.options.find((option) => option.id === poll.ownOptionId)
  return (
    <Link className="home-poll-summary" to={pollLink(poll)} aria-labelledby={id}>
      <header>
        <h3 id={id}>{poll.title}</h3>
        <Icon icon={ArrowUpRight} />
      </header>
      {poll.detail && <p className="home-poll-summary__detail">{poll.detail}</p>}
      <div className="home-poll-summary__facts">
        {closed ? <span>Voting closed</span> : <PollTimeRemaining value={poll.closesAt} />}
        <span>
          {poll.totalVotes} {poll.totalVotes === 1 ? 'vote' : 'votes'}
        </span>
      </div>
      <p className="home-poll-summary__choice">
        {choice
          ? `Your choice: ${choice.label}`
          : closed
            ? 'You did not vote on this poll.'
            : 'Your vote is still to come.'}
      </p>
      <span className="home-poll-summary__action">
        {closed ? 'View final results' : choice ? 'View poll' : 'View poll and vote'}
      </span>
    </Link>
  )
}
