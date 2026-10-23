import { createContext, lazy, useContext } from 'react'
import { createBrowserRouter, RouterProvider, Route, Routes } from 'react-router'
import { DraftProtectionProvider, useDraftProtection } from '../features/drafts/DraftProtection'
import type { FamilyUser } from '../types/auth'
import { PollsSync } from '../features/polls/PollsSync'
import { UsagePresence } from '../features/usage/UsagePresence'
import { FamilyLayout } from '../components/layout/FamilyLayout'
import { ShoppingSync } from '../features/shopping/ShoppingSync'
import { CalendarSync } from '../features/calendar/CalendarSync'
import { MemoriesSync } from '../features/memories/MemoriesSync'
const FamilyHomePage = lazy(() => import('../pages/family/FamilyHomePage'))
const PollsPage = lazy(() => import('../pages/family/PollsPage'))
const CalendarPage = lazy(() => import('../pages/family/CalendarPage'))
const AlertsPage = lazy(() => import('../pages/family/AlertsPage'))
const MemoriesPage = lazy(() => import('../pages/family/MemoriesPage'))
const ListsPage = lazy(() => import('../pages/family/ListsPage'))
const PersonalNotesPage = lazy(() => import('../pages/family/PersonalNotesPage'))
const AdminPage = lazy(() => import('../pages/admin/AdminPage'))
const ProfilePage = lazy(() => import('../pages/profile/ProfilePage'))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'))

export type FamilyRouterProps = {
  user: FamilyUser
  onSessionExpired: () => void
  onChangePassword: () => void
  onLogout: () => void
  loggingOut: boolean
  error: string
}
const RoutingContext = createContext<FamilyRouterProps | null>(null)
const router = createBrowserRouter([{ path: '*', element: <FamilyRoutes /> }])
export function FamilyRouter(props: FamilyRouterProps) {
  return (
    <RoutingContext.Provider value={props}>
      <RouterProvider router={router} />
    </RoutingContext.Provider>
  )
}
function FamilyRoutes() {
  const props = useContext(RoutingContext)
  if (!props) throw new Error('A family session is required')
  return (
    <DraftProtectionProvider>
      <ProtectedFamilyRoutes {...props} />
    </DraftProtectionProvider>
  )
}

function ProtectedFamilyRoutes(props: FamilyRouterProps) {
  const { user, onSessionExpired, ...layoutProps } = props
  const { protect } = useDraftProtection()
  return (
    <>
      <UsagePresence onSessionExpired={onSessionExpired} />
      <ShoppingSync onSessionExpired={onSessionExpired}>
        <PollsSync onSessionExpired={onSessionExpired} />
        <CalendarSync onSessionExpired={onSessionExpired} />
        <MemoriesSync onSessionExpired={onSessionExpired} />
        <Routes>
          <Route
            element={
              <FamilyLayout
                user={user}
                {...layoutProps}
                onLogout={() => protect(layoutProps.onLogout)}
                onChangePassword={() => protect(layoutProps.onChangePassword)}
              />
            }
          >
            <Route index element={<FamilyHomePage />} />
            <Route path="polls" element={<PollsPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="alerts" element={<AlertsPage />} />
            <Route path="memories" element={<MemoriesPage />} />
            <Route path="lists" element={<ListsPage />} />
            <Route
              path="notes"
              element={<PersonalNotesPage onSessionExpired={onSessionExpired} />}
            />
            <Route path="admin" element={<AdminPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </ShoppingSync>
    </>
  )
}
