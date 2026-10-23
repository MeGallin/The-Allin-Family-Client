import { ShieldCheck } from 'lucide-react'
import type { FamilyUser } from '../../types/auth'
import { Icon } from '../ui/Icon'
import './ProfileIdentity.css'

export function ProfileIdentity({ user }: { user: FamilyUser }) {
  return (
    <aside className="profile-identity" aria-label="Your family identity">
      <div className="profile-identity__intro">
        <span className="profile-identity__avatar" aria-hidden="true">
          {Array.from(user.familyName.trim())[0]?.toLocaleUpperCase()}
        </span>
        <div className="profile-identity__name">
          <span className="profile-identity__family">The Allin Family</span>
          <h2>{user.familyName}</h2>
          <p>{user.displayName}</p>
          <span className="profile-identity__username">@{user.username}</span>
        </div>
      </div>
      <dl className="profile-identity__details">
        <div>
          <dt>Username</dt>
          <dd>@{user.username}</dd>
        </div>
        <div>
          <dt>Account name</dt>
          <dd>{user.displayName}</dd>
        </div>
      </dl>
      <div className="profile-identity__foot">
        <Icon icon={ShieldCheck} />
        <p>
          A space that feels like you.<span>Part of the Allin family.</span>
        </p>
      </div>
    </aside>
  )
}
