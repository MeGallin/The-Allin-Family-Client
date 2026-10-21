import { KeyRound, Settings2 } from 'lucide-react'
import { Icon } from '../ui/Icon'
import { UserNicknames } from './UserNicknames'
import './AdminMembers.css'

export default function AdminMembers() {
  return (
    <div className="page-stack">
      <UserNicknames />
      <div className="admin-roadmap">
        <section className="surface-card">
          <Icon icon={KeyRound} />
          <h2>Family account support</h2>
          <p>Password reset and account management tools will be added here.</p>
          <span className="status-label">Coming later</span>
        </section>
        <section className="surface-card">
          <Icon icon={Settings2} />
          <h2>Site controls</h2>
          <p>
            Content controls are planned. Use the activity view to inspect shared changes today.
          </p>
          <span className="status-label">Coming later</span>
        </section>
      </div>
    </div>
  )
}
