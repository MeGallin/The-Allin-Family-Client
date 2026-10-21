import { Check, Star } from 'lucide-react'
import { Icon } from '../../ui/Icon'
import './ImportanceOption.css'
export function ImportanceOption({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean
  disabled: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className="importance-option">
      <span className="importance-option__control">
        <input
          type="checkbox"
          aria-label="Important"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <Icon icon={Check} />
      </span>
      <span>
        <Icon icon={Star} /> Important{' '}
        <span className="importance-option__hint">· keep at the top</span>
      </span>
    </label>
  )
}
