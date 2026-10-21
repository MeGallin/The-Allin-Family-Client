import { useState } from 'react'
import type { RemovalRecord } from '../../features/removals/removals-slice'
import { Modal } from '../ui/Modal'
import { RemovalDelayHint } from './RemovalDelayHint'
export function RemovalConfirmation({
  item,
  noun,
  history,
  busy,
  error,
  schedule,
  onClose,
}: {
  item: RemovalRecord
  noun: string
  history: string
  busy: boolean
  error: string
  schedule: (item: RemovalRecord) => boolean
  onClose: () => void
}) {
  const [original] = useState(item)
  const stale = original.version !== item.version
  const problem = stale
    ? 'This content changed in another window. Close and review it before removing.'
    : error
  return (
    <Modal title={'Remove this ' + noun + '?'} busy={busy} onClose={onClose}>
      <p>
        “{item.title}” will be removed. {history}
      </p>
      <RemovalDelayHint />
      {problem && (
        <p className="error" role="alert">
          {problem}
        </p>
      )}
      <div className="actions">
        <button
          type="button"
          disabled={busy || stale}
          onClick={() => {
            if (schedule(original)) onClose()
          }}
        >
          Remove {noun}
        </button>
        <button type="button" className="secondary" disabled={busy} onClick={onClose}>
          Keep {noun}
        </button>
      </div>
    </Modal>
  )
}
