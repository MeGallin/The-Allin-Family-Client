import { useState } from 'react'
import { History } from 'lucide-react'
import type { DinnerSpin } from '../../features/widgets/types'
import { ContentSurface } from '../ui/ContentSurface'
import { FriendlyTime } from '../ui/FriendlyTime'
import { Icon } from '../ui/Icon'
import './WidgetHistory.css'
export function WidgetHistory({ spins }: { spins: DinnerSpin[] }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <ContentSurface className="widget-history">
      <header>
        <h2>Your private trials</h2>
        <Icon icon={History} />
      </header>
      {spins.length ? (
        <ol>
          {(expanded ? spins : spins.slice(0, 3)).map((pick) => (
            <li key={pick.id}>
              <strong>{pick.meal}</strong>
              <span>
                Picked by {pick.actor.name} · <FriendlyTime value={pick.occurredAt} />
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="note">No trials yet. Your first private spin will appear here.</p>
      )}
      {spins.length > 3 && (
        <button
          type="button"
          className="text-button"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Show fewer trials' : `Show all ${spins.length} private trials`}
        </button>
      )}
      <p className="note">
        Your last 10 trials. Other family members cannot see these, even on a family installation.
      </p>
    </ContentSurface>
  )
}
