import { Check, Palette } from 'lucide-react'
import { Icon } from '../ui/Icon'
import { AccentPicker } from './AccentPicker'
import './ProfileAppearance.css'

export function ProfileAppearance({ name }: { name: string }) {
  return (
    <div className="profile-appearance">
      <div className="profile-appearance__preview" aria-hidden="true">
        <span className="profile-appearance__orbit" />
        <span className="profile-appearance__initial">
          {Array.from(name.trim())[0]?.toLocaleUpperCase()}
        </span>
        <span className="profile-appearance__sample">
          <Icon icon={Check} />A little more you.
        </span>
      </div>
      <h3>Make it yours.</h3>
      <AccentPicker />
      <p className="profile-appearance__scope">
        <Icon icon={Palette} />
        Your highlight is personal to this account in this browser.
      </p>
    </div>
  )
}
