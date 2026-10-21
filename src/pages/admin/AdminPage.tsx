import { lazy, Suspense } from 'react'
import { LoadingState } from '../../components/ui/LoadingState'
import { Link, Navigate, useSearchParams } from 'react-router'
import { useFamilyData } from '../../features/family/useFamilyData'
import { PageHeader } from '../../components/ui/PageHeader'
import './AdminPage.css'
import { adminPeriod } from '../../features/admin/useAdminFilters'

const AdminActivity = lazy(() => import('../../components/admin/activity/AdminActivity'))
const AdminUsage = lazy(() => import('../../components/admin/usage/AdminUsage'))
const AdminOverview = lazy(() => import('../../components/admin/insights/AdminOverview'))
const AdminMembers = lazy(() => import('../../components/admin/AdminMembers'))
const views = [
  ['overview', 'Overview'],
  ['usage', 'Usage details'],
  ['activity', 'Shared activity'],
  ['members', 'Family members'],
] as const

export default function AdminPage() {
  const { user } = useFamilyData()
  const [params] = useSearchParams()
  const selected = params.get('view') ?? 'overview'
  const view = views.some(([key]) => key === selected) ? selected : 'overview'
  if (user.role !== 'admin') return <Navigate to="/" replace />
  return (
    <div className="page-stack page-enter">
      <PageHeader
        title="Administration"
        description="Understand the family space. Look after the people in it."
      />
      <nav className="admin-views" aria-label="Administration sections">
        {views.map(([key, label]) => (
          <Link
            key={key}
            to={
              key === 'overview'
                ? '/admin?days=' + adminPeriod(params.get('days'))
                : '/admin?view=' + key + '&days=' + adminPeriod(params.get('days'), true)
            }
            aria-current={view === key ? 'page' : undefined}
          >
            {label}
          </Link>
        ))}
      </nav>
      <Suspense fallback={<LoadingState label="Opening administration…" />}>
        {view === 'overview' && <AdminOverview />}
        {view === 'usage' && <AdminUsage />}
        {view === 'activity' && <AdminActivity />}
        {view === 'members' && <AdminMembers />}
      </Suspense>
    </div>
  )
}
