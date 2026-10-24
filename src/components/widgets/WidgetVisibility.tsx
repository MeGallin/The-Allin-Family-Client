import { LockKeyhole, Users } from 'lucide-react'
import { Icon } from '../ui/Icon'
import './WidgetVisibility.css'
export function WidgetVisibility({ visibility }: { visibility: 'private' | 'family' }) {
  return (
    <span className={'widget-visibility widget-visibility--' + visibility}>
      <Icon icon={visibility === 'family' ? Users : LockKeyhole} />
      {visibility === 'family' ? 'Family installation' : 'Personal installation'}
    </span>
  )
}
