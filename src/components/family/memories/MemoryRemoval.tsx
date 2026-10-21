import type { FamilyMemory } from '../../../features/memories/types'
import { useMemories } from '../../../features/memories/useMemories'
import { Modal } from '../../ui/Modal'
export default function MemoryRemoval({
  memory,
  onClose,
}: {
  memory: FamilyMemory
  onClose: () => void
}) {
  const { remove, pending, error } = useMemories()
  return (
    <Modal title="Remove this memory?" onClose={onClose} busy={pending}>
      <p>
        “{memory.title}” will be removed from the family pages. Its change history will be kept.
      </p>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <div className="actions">
        <button
          type="button"
          disabled={pending}
          onClick={async () => {
            if (await remove(memory)) onClose()
          }}
        >
          {pending ? 'Removing…' : 'Remove memory'}
        </button>
        <button type="button" className="secondary" disabled={pending} onClick={onClose}>
          Keep memory
        </button>
      </div>
    </Modal>
  )
}
