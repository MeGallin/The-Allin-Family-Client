import { useEffect, useRef, useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../../app/store-hooks'
import { removalUndone } from '../../features/removals/removals-slice'
import { REMOVAL_DELAY_MS } from '../../features/removals/removals-slice'
import { Icon } from '../ui/Icon'
import './PendingRemovals.css'

export function PendingRemovals() {
  const dispatch = useAppDispatch()
  const { entries: removals, feedback } = useAppSelector((state) => state.removals)
  const auth = useAppSelector((state) => state.auth)
  const entries = Object.values(removals).filter(
    (entry) => entry.ownerId === auth.user?.id && entry.generation === auth.generation,
  )
  const [now, setNow] = useState(Date.now)
  const section = useRef<HTMLElement>(null)
  const previous = useRef(new Set<string>())
  const undoFocusId = useRef<string | null>(null)
  const tokens = entries.map((entry) => entry.token).join(',')
  useEffect(() => {
    const current = tokens ? tokens.split(',') : []
    const added = current.find((token) => !previous.current.has(token))
    if (added)
      section.current?.querySelector<HTMLButtonElement>(`button[data-removal="${added}"]`)?.focus()
    previous.current = new Set(current)
    if (undoFocusId.current) {
      const target =
        document.getElementById(undoFocusId.current) ?? document.getElementById('family-content')
      target?.focus()
      undoFocusId.current = null
    }
  }, [tokens])
  useEffect(() => {
    if (!entries.length) return
    setNow(Date.now())
    const interval = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [entries.length])
  if (!entries.length)
    return feedback ? (
      <p role="status" className="note">
        {feedback}
      </p>
    ) : null
  return (
    <section ref={section} className="pending-removals" aria-label="Pending removals">
      <h2>Changed your mind?</h2>
      <p role="status" className="note">
        {feedback}
      </p>
      <p className="note">
        Undo before the countdown ends to keep your content. Refreshing or signing out cancels
        pending removals.
      </p>
      <ul>
        {entries.map((entry) => {
          const remaining = Math.max(0, Math.ceil((entry.deadline - now) / 1000))
          return (
            <li key={entry.token}>
              <div className="pending-removals__description">
                <Icon icon={LoaderCircle} className="pending-removals__spinner" />
                <div>
                  <strong>{entry.item.title}</strong>
                  <span className="note">
                    {' '}
                    · {entry.domain === 'notes' ? 'Private note' : entry.domain}
                  </span>
                  <p>
                    {entry.sending
                      ? 'Removing…'
                      : remaining
                        ? `Removing in ${remaining} seconds`
                        : 'Waiting to finish removal…'}
                  </p>
                </div>
              </div>
              <button
                data-removal={entry.token}
                type="button"
                className="secondary"
                disabled={entry.sending}
                onClick={() => {
                  undoFocusId.current = entry.domain + '-remove-' + entry.item.id
                  dispatch(removalUndone(entry.key))
                }}
                aria-label={'Undo removal of ' + entry.item.title}
              >
                Undo
              </button>
              <progress
                className="pending-removals__progress"
                max={REMOVAL_DELAY_MS / 1000}
                value={remaining}
                aria-label={'Time left to undo removal of ' + entry.item.title}
              />
            </li>
          )
        })}
      </ul>
    </section>
  )
}
