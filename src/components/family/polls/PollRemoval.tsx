import { usePolls } from '../../../features/polls/usePolls'
import type { FamilyPollRecord } from '../../../features/polls/types'
import { RemovalConfirmation } from '../../removals/RemovalConfirmation'
export default function PollRemoval({
  poll,
  onClose,
}: {
  poll: FamilyPollRecord
  onClose: () => void
}) {
  const { remove, pending, error } = usePolls()
  return (
    <RemovalConfirmation
      item={poll}
      noun="poll"
      history="Its votes and activity history will be kept."
      busy={pending}
      error={error}
      schedule={remove}
      onClose={onClose}
    />
  )
}
