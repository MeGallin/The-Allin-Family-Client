import { useNow } from '../../../hooks/useNow'
import { formatPollDeadline, isPollClosed } from '../../../features/polls/poll-deadline'
import { PollTimeRemaining } from './PollTimeRemaining'
import { useId } from 'react'
import { Link, useLocation } from 'react-router'
import { pollActionPath } from '../../../features/polls/poll-links'
import { useAppSelector } from '../../../app/store-hooks'
import { usePolls } from '../../../features/polls/usePolls'
import type { FamilyPollRecord } from '../../../features/polls/types'
import { FriendlyTime } from '../../ui/FriendlyTime'
import { RemovalNotice } from '../../removals/RemovalNotice'
import './PollCard.css'
export function PollCard({ poll }: { poll: FamilyPollRecord }) {
  const { vote, close, pending, removals, clearError } = usePolls()
  const user = useAppSelector((state) => state.auth.user)
  const location = useLocation()
  const group = useId()
  const now = useNow()
  const closed = isPollClosed(poll, now)
  const removal = removals[poll.id]
  const manage = user?.role === 'admin' || user?.id === poll.createdBy.id
  return (
    <article
      id={'poll-' + poll.id}
      tabIndex={-1}
      className="poll-card"
      aria-labelledby={group + '-title'}
    >
      <header className="poll-card__header">
        <h2 id={group + '-title'}>{poll.title}</h2>
        <span className="status-label">{closed ? 'Voting closed' : 'Open for votes'}</span>
      </header>
      <p className="poll-card__deadline">
        {!closed && (
          <>
            <PollTimeRemaining value={poll.closesAt} /> ·{' '}
          </>
        )}
        <time dateTime={poll.closesAt}>
          {closed && 'Scheduled cutoff · '}
          {formatPollDeadline(poll.closesAt)}
        </time>
      </p>
      {poll.detail && <p className="poll-card__detail">{poll.detail}</p>}
      <p className="note">
        {closed
          ? 'The final results are below.'
          : 'Choose an option to save your vote. You can change it while voting is open.'}
      </p>
      <fieldset className="poll-card__choices" disabled={pending || closed || !!removal}>
        <legend className="sr-only">{'Vote on ' + poll.title}</legend>
        {poll.options.map((option) => {
          const percentage = poll.totalVotes
            ? Math.round((option.votes / poll.totalVotes) * 100)
            : 0
          return (
            <label
              className={
                'poll-card__choice' + (poll.ownOptionId === option.id ? ' is-selected' : '')
              }
              key={option.id}
            >
              <span className="poll-card__choice-line">
                <input
                  type="radio"
                  name={group}
                  aria-label={option.label}
                  checked={poll.ownOptionId === option.id}
                  onChange={async (event) => {
                    const input = event.currentTarget
                    await vote(poll, option.id)
                    if (input.isConnected) input.focus()
                  }}
                />
                <span>{option.label}</span>
              </span>
              <span className="poll-card__count">
                {option.votes} {option.votes === 1 ? 'vote' : 'votes'} ({percentage}%){' '}
                {poll.ownOptionId === option.id && <strong> · Your choice</strong>}
              </span>
              <progress
                max={poll.totalVotes || 1}
                value={option.votes}
                aria-label={
                  option.label +
                  ': ' +
                  option.votes +
                  (option.votes === 1 ? ' vote, ' : ' votes, ') +
                  percentage +
                  ' percent'
                }
              />
            </label>
          )
        })}
      </fieldset>
      <p className="poll-card__total">
        {poll.totalVotes} {poll.totalVotes === 1 ? 'family member has' : 'family members have'}{' '}
        voted.
      </p>
      {!closed && poll.ownOptionId && !removal && (
        <button
          className="secondary"
          type="button"
          disabled={pending}
          onClick={async (event) => {
            const button = event.currentTarget
            const card = button.closest('article')
            await vote(poll, null)
            if (button.isConnected) button.focus()
            else if (card?.isConnected) {
              const target =
                card.querySelector<HTMLInputElement>('input[type="radio"]:not(:disabled)') ??
                document.getElementById('family-content')
              target?.focus()
            }
          }}
        >
          Withdraw my vote
        </button>
      )}
      <p className="note">
        Added by {poll.createdBy.displayName} · <FriendlyTime value={poll.createdAt} />
        {poll.version > 1 && (
          <>
            <br />
            Updated by {poll.updatedBy.displayName} · <FriendlyTime value={poll.updatedAt} />
          </>
        )}
      </p>
      <RemovalNotice removal={removal} />
      {manage && !removal && (
        <footer className="poll-card__actions">
          <Link
            to={pollActionPath(location.search, location.hash, 'edit', poll.id)}
            onClick={clearError}
          >
            Edit poll
          </Link>
          {closed ? (
            <Link
              to={pollActionPath(location.search, location.hash, 'edit', poll.id)}
              onClick={clearError}
            >
              Reopen voting
            </Link>
          ) : (
            <button
              className="secondary"
              disabled={pending}
              type="button"
              onClick={async (event) => {
                const button = event.currentTarget
                if (await close(poll)) {
                  if (button.isConnected) button.focus()
                  else document.getElementById('family-content')?.focus()
                }
              }}
            >
              Close voting
            </button>
          )}
          <Link
            id={'polls-remove-' + poll.id}
            to={pollActionPath(location.search, location.hash, 'remove', poll.id)}
            onClick={clearError}
          >
            Remove poll
          </Link>
        </footer>
      )}
    </article>
  )
}
