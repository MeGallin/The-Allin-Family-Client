import type { FamilyMemory } from '../../../features/memories/types'
import { useMemories } from '../../../features/memories/useMemories'
import { RemovalConfirmation } from '../../removals/RemovalConfirmation'
export default function MemoryRemoval({
  memory,
  onClose,
}: {
  memory: FamilyMemory
  onClose: () => void
}) {
  const { remove, pending, error } = useMemories()
  return (
    <RemovalConfirmation
      item={memory}
      noun="memory"
      history="Its change history will be kept."
      busy={pending}
      error={error}
      schedule={remove}
      onClose={onClose}
    />
  )
}
