import { LoaderCircle } from 'lucide-react'
import { Icon } from './Icon'
import './LoadingState.css'

export function LoadingState({ label = 'Loading your family space…' }: { label?: string }) {
  return (
    <div className="loading-state" role="status">
      <Icon icon={LoaderCircle} className="loading-state__spinner" />
      <span>{label}</span>
    </div>
  )
}
