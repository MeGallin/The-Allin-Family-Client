import { useEffect, useRef, useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { useShopping } from '../../../features/shopping/useShopping'
import { REMOVAL_DELAY_MS } from '../../../features/shopping/shopping-ui-slice'
import { Icon } from '../../ui/Icon'
import './PendingShoppingRemovals.css'

export function PendingShoppingRemovals() {
  const { removals, undoRemove } = useShopping()
  const entries = Object.values(removals)
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
        document.getElementById('shopping-remove-' + undoFocusId.current) ??
        document.getElementById('family-content')
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
  if (!entries.length) return null
  return (
    <section ref={section} className="pending-removals" aria-label="Pending shopping removals">
      <h2>Changed your mind?</h2>
      <p className="note">
        Undo before the countdown ends to keep an item. Refreshing or signing out cancels pending
        removals.
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
                  undoFocusId.current = entry.item.id
                  undoRemove(entry.item.id)
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
