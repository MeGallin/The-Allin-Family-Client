import { REMOVAL_DELAY_MS } from '../../features/removals/removals-slice'
export function RemovalDelayHint() {
  return (
    <p>
      Removal starts after {REMOVAL_DELAY_MS / 1000} seconds. Use Undo above the page to keep it.
    </p>
  )
}
