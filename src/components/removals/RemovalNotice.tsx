import type { PendingRemoval } from '../../features/removals/removals-slice'
export function RemovalNotice({ removal }: { removal?: PendingRemoval }) {
  return removal ? (
    <p className="note" role="status">
      {removal.sending ? 'Removing…' : 'Removal pending. Use Undo above to keep this.'}
    </p>
  ) : null
}
