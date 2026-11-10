import { Link } from 'react-router'
import { useRef, useState } from 'react'
import { useDailyWord } from '../../features/daily-word/useDailyWord'
import { useDraftGuard } from '../../features/drafts/DraftProtection'
import { dailyWordApi } from '../../services/daily-word-query'
import { useAppSelector } from '../../app/store-hooks'
import { shoppingError } from '../../services/shopping-query'
import { useLiveQueryOptions } from '../../hooks/useLiveQueryOptions'
import { WORD_PATH } from '../../features/daily-word/types'
import { ContentSurface } from '../ui/ContentSurface'
import { WidgetHelp } from '../ui/WidgetHelp'
import { LoadingState } from '../ui/LoadingState'
import './DailyWord.css'
export default function DailyWordResults() {
  const word = useDailyWord()
  const retry = useRef<{
    day: string
    revision: number
    version: number
    requestKey: string
  } | null>(null)
  const [message, setMessage] = useState('')
  const [unresolved, setUnresolved] = useState(false)
  useDraftGuard(!!retry.current, word.pending)
  const uncertain = !!retry.current && unresolved
  async function withdraw(day: string) {
    const own = word.data?.week.find((item) => item.date === day)
    if (!word.data || !own || word.pending || word.offline) return
    if (!retry.current)
      retry.current = {
        day,
        revision: own.revision,
        version: word.data.installationVersion,
        requestKey: crypto.randomUUID(),
      }
    setUnresolved(true)
    const result = await word.write('withdraw', retry.current)
    if (result?.failure && result.failure.status > 0 && result.failure.status < 500)
      setUnresolved(false)
    if (result?.receipt) {
      retry.current = null
      setUnresolved(false)
      setMessage('Your result was withdrawn.')
      word.clearError()
    }
  }
  const owner = useAppSelector((s) => s.auth.user?.id)
  const live = useLiveQueryOptions('/my-space')
  const query = dailyWordApi.useGetDailyWordResultsQuery(owner ?? 0, {
    ...live,
    skip: !owner || live.skip,
  })
  const error = shoppingError(query.error)
  return (
    <ContentSurface className="daily-word-results">
      <div className="dw-heading">
        <div>
          <p className="eyebrow">Shared by choice</p>
          <h2>Daily Word results</h2>
        </div>
        <Link className="button-link" to={WORD_PATH}>
          Play today
        </Link>
      </div>
      <WidgetHelp>
        <ol>
          <li>
            <strong>Read the shared finishes.</strong> This list covers the last seven London days
            and only includes results people chose to share. Solved shows the attempt count;
            Finished means all six guesses were used. An absent result does not prove someone did
            not play. Nobody’s answer words, guesses or private history appear here.
          </li>
          <li>
            <strong>Play or share your own result.</strong> Choose Play today to open your personal
            board. After finishing, Share finished result publishes your date, outcome and attempt
            count. Sharing is optional and happens separately from submitting guesses.
          </li>
          <li>
            <strong>Manage your own sharing.</strong> Withdraw my result removes your shared result
            without deleting your private progress. If you removed Daily Word, reinstall to manage
            it; removal alone does not withdraw results. Refresh results checks the saved list. Wait
            for withdrawal confirmation and use Retry withdrawal if its response is uncertain.
          </li>
        </ol>
      </WidgetHelp>
      <p>
        Finished results from the last seven London days. Everyone’s words and guesses stay private.
      </p>
      {query.isLoading && <LoadingState label="Opening shared results…" />}
      {error && (
        <p role="alert" className="error">
          {error.message}
        </p>
      )}
      {word.error && (
        <p role="alert" className="error">
          {word.error}
        </p>
      )}
      {message && <p role="status">{message}</p>}
      {retry.current && (word.failure || unresolved) && (
        <div className="dw-notice">
          <p>
            {uncertain
              ? 'Withdrawal was not confirmed. Retry the same request to resolve it.'
              : 'Your result changed. Refresh and review it before trying again.'}
          </p>
          <button
            type="button"
            disabled={word.pending || word.offline}
            onClick={() => void withdraw(retry.current!.day)}
          >
            Retry withdrawal
          </button>
          {!uncertain && (
            <button
              type="button"
              className="secondary"
              onClick={() => {
                retry.current = null
                word.clearError()
                word.refresh()
                setMessage('Latest status requested.')
              }}
            >
              Load latest status
            </button>
          )}
        </div>
      )}
      <button
        type="button"
        className="secondary"
        disabled={query.isFetching}
        onClick={() => void query.refetch()}
      >
        Refresh results
      </button>
      {query.data &&
        (query.data.results.length ? (
          <ul className="dw-results-list">
            {query.data.results.map((result) => (
              <li key={result.ownerId + result.date}>
                <strong>{result.name}</strong>
                <time dateTime={result.date}>{result.date}</time>
                <span>
                  {result.solved ? `Solved in ${result.attempts} / 6` : 'Finished · 6 / 6'}
                </span>
                {result.ownerId === owner &&
                  (word.installed ? (
                    <button
                      type="button"
                      className="secondary"
                      disabled={
                        word.pending ||
                        word.offline ||
                        !!retry.current ||
                        !!word.removals['daily-word']
                      }
                      onClick={() => void withdraw(result.date)}
                    >
                      Withdraw my result
                    </button>
                  ) : (
                    <Link to={WORD_PATH}>Reinstall to manage my result</Link>
                  ))}
              </li>
            ))}
          </ul>
        ) : (
          <p>No finished results shared in the last seven days.</p>
        ))}
    </ContentSurface>
  )
}
