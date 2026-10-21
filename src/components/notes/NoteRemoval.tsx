import type { PersonalNote } from '../../features/notes/types'
import { usePersonalNotes } from '../../features/notes/usePersonalNotes'
import { RemovalConfirmation } from '../removals/RemovalConfirmation'
export default function NoteRemoval({
  note,
  onClose,
}: {
  note: PersonalNote
  onClose: () => void
}) {
  const { remove, pending, error } = usePersonalNotes()
  return (
    <RemovalConfirmation
      item={note}
      noun="note"
      history="Its history remains private to you."
      busy={pending}
      error={error}
      schedule={remove}
      onClose={onClose}
    />
  )
}
