import { Navigate } from 'react-router'
import { KeyRound, Settings2, ShieldCheck } from 'lucide-react'
import { useFamilyData } from '../../features/family/useFamilyData'
import { Icon } from '../../components/ui/Icon'
import { PageHeader } from '../../components/ui/PageHeader'
import './AdminPage.css'
import { UserNicknames } from '../../components/admin/UserNicknames'

export default function AdminPage() {
  const { user } = useFamilyData()
  if (user.role !== 'admin') return <Navigate to="/" replace />
  return (
    <div className="page-stack page-enter">
      <PageHeader title="Administration" description="A place to look after the family space." />
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
          <p>Content controls and useful activity summaries will live here.</p>
          <span className="status-label">Coming later</span>
        </section>
      </div>
      <p className="admin-roadmap__note">
        <Icon icon={ShieldCheck} />
        Signed in with administrator access. Nicknames can be updated above. Other account and site
        tools are coming later.
      </p>
    </div>
  )
}
