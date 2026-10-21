import { lazy } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router'
import { FamilyStateLifetime } from '../features/family/FamilyStateLifetime'
import { useFamilyHome } from '../hooks/useFamilyHome'
import { FamilyLayout } from '../components/layout/FamilyLayout'
import { LoadingState } from '../components/ui/LoadingState'
import { ShoppingSync } from '../features/shopping/ShoppingSync'
import { CalendarSync } from '../features/calendar/CalendarSync'
import { useAppSelector } from './store-hooks'

const FamilyHomePage = lazy(() => import('../pages/family/FamilyHomePage'))
const CalendarPage = lazy(() => import('../pages/family/CalendarPage'))
const MemoriesPage = lazy(() => import('../pages/family/MemoriesPage'))
const ListsPage = lazy(() => import('../pages/family/ListsPage'))
const AdminPage = lazy(() => import('../pages/admin/AdminPage'))
const ProfilePage = lazy(() => import('../pages/profile/ProfilePage'))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'))

type Props = {
  onSessionExpired: () => void
  onChangePassword: () => void
  onLogout: () => void
  loggingOut: boolean
  error: string
}

export default function FamilyApp({ onSessionExpired, ...layoutProps }: Props) {
  const { home, error, retry } = useFamilyHome(onSessionExpired)
  const user = useAppSelector((state) => state.auth.user)
  if (error) {
    return (
      <main className="app-shell">
        <section className="surface-card">
          <h1 className="page-title">Let’s try that again.</h1>
          <p className="error" role="alert">
            {error}
          </p>
          <button type="button" onClick={retry}>
            Try again
          </button>
        </section>
      </main>
    )
  }
  if (!home)
    return (
      <main className="app-shell">
        <LoadingState />
      </main>
    )

  return (
    <BrowserRouter>
      <FamilyStateLifetime>
        <ShoppingSync onSessionExpired={onSessionExpired}>
          <CalendarSync onSessionExpired={onSessionExpired} />
          <Routes>
            <Route element={<FamilyLayout user={user ?? home.user} {...layoutProps} />}>
              <Route index element={<FamilyHomePage />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="memories" element={<MemoriesPage />} />
              <Route path="lists" element={<ListsPage />} />
              <Route path="admin" element={<AdminPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </ShoppingSync>
      </FamilyStateLifetime>
    </BrowserRouter>
  )
}
