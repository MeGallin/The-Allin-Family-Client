import { RefreshCw } from 'lucide-react'
import { Icon } from './Icon'

export function RefreshButton({
  label,
  disabled = false,
  onClick,
}: {
  label: string
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className="icon-button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      <Icon icon={RefreshCw} />
    </button>
  )
}
