import type { ReactNode } from 'react'
import { RefreshButton } from './RefreshButton'
import './CollectionToolbar.css'

export function CollectionToolbar({
  label,
  busy,
  feedback,
  onRefresh,
  children,
}: {
  label: string
  busy: boolean
  feedback: string
  onRefresh: () => void
  children: ReactNode
}) {
  return (
    <div className="collection-toolbar">
      <div className="collection-toolbar__hint">{children}</div>
      <RefreshButton label={label} disabled={busy} onClick={onRefresh} />
      <p className="collection-toolbar__feedback note" role="status">
        {feedback}
      </p>
    </div>
  )
}
