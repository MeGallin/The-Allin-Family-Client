import { lazy, Suspense } from 'react'
import { LoadingState } from '../../components/ui/LoadingState'
import { Navigate } from 'react-router'
import { KeyRound, Settings2, ShieldCheck } from 'lucide-react'
import { useFamilyData } from '../../features/family/useFamilyData'
import { Icon } from '../../components/ui/Icon'
import { PageHeader } from '../../components/ui/PageHeader'
import './AdminPage.css'
import { UserNicknames } from '../../components/admin/UserNicknames'

const AdminActivity = lazy(() => import('../../components/admin/activity/AdminActivity'))
const AdminUsage = lazy(() => import('../../components/admin/usage/AdminUsage'))

export default function AdminPage() {
  const { user } = useFamilyData()
  if (user.role !== 'admin') return <Navigate to="/" replace />
  return (
    <div className="page-stack page-enter">
      <PageHeader title="Administration" description="A place to look after the family space." />
      <Suspense fallback={<LoadingState label="Opening platform usage…" />}>
        <AdminUsage />
      </Suspense>
      <Suspense fallback={<LoadingState label="Opening family activity…" />}>
        <AdminActivity />
      </Suspense>
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
          <p>Content controls will be added here. Shared activity is available above.</p>
          <span className="status-label">Coming later</span>
        </section>
      </div>
      <p className="admin-roadmap__note">
        <Icon icon={ShieldCheck} />
        Signed in with administrator access. Review shared activity and help with family nicknames
        above. Other account and site tools are coming later.
      </p>
    </div>
  )
}
