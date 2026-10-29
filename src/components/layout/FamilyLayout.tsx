import { Suspense, useLayoutEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react'
import type { FamilyUser } from '../../types/auth'
import { Icon } from '../ui/Icon'
import { AccountMenu } from './AccountMenu'
import { FamilyNavigation } from './FamilyNavigation'
import { LoadingState } from '../ui/LoadingState'
import { PendingRemovals } from '../removals/PendingRemovals'
import { FamilyBrand } from '../brand/FamilyBrand'
import { FamilyFooter } from '../brand/FamilyFooter'
import { activeBuiltinWidget } from '../../features/widgets/builtin-widgets'
import './FamilyLayout.css'

type Props = {
  user: FamilyUser
  onChangePassword: () => void
  onLogout: () => void
  loggingOut: boolean
  error: string
}

export function FamilyLayout({ user, onChangePassword, onLogout, loggingOut, error }: Props) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const location = useLocation()
  const tool =
    location.pathname === '/my-space'
      ? activeBuiltinWidget(new URLSearchParams(location.search))?.id
      : undefined
  useLayoutEffect(() => {
    document.getElementById('family-content')?.focus({ preventScroll: true })
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname, tool])

  return (
    <div
      className={'family-layout' + (sidebarCollapsed ? ' family-layout--sidebar-collapsed' : '')}
    >
      <a className="skip-link" href="#family-content">
        Skip to content
      </a>
      <aside className="family-layout__sidebar">
        <button
          type="button"
          className="icon-button family-layout__sidebar-toggle"
          aria-label={sidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}
          title={sidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}
          aria-expanded={!sidebarCollapsed}
          aria-controls="family-sidebar-content"
          onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
        >
          <Icon icon={sidebarCollapsed ? ChevronRight : ChevronLeft} />
        </button>
        <div id="family-sidebar-content" className="family-layout__sidebar-content">
          <FamilyNavigation compact={sidebarCollapsed} familyName={user.familyName} />
          {user.role === 'admin' && (
            <NavLink
              to="/admin"
              className="family-layout__admin"
              aria-label="Administration"
              title={sidebarCollapsed ? 'Administration' : undefined}
            >
              <Icon icon={ShieldCheck} />
              <span>Administration</span>
            </NavLink>
          )}
        </div>
      </aside>
      <div className="family-layout__workspace">
        <header className="family-layout__header">
          <Link to="/" className="family-brand" aria-label="The Allin Family home">
            <FamilyBrand />
          </Link>
          <AccountMenu
            user={user}
            onChangePassword={onChangePassword}
            onLogout={onLogout}
            loggingOut={loggingOut}
          />
        </header>
        <main id="family-content" className="family-layout__content" tabIndex={-1}>
          <PendingRemovals />
          {error && (
            <p className="feedback feedback--error" role="alert">
              {error}
            </p>
          )}
          <Suspense fallback={<LoadingState label="Opening this page…" />}>
            <Outlet />
          </Suspense>
        </main>
        <div className="family-layout__footer">
          <FamilyFooter />
        </div>
        <FamilyNavigation mobile familyName={user.familyName} />
      </div>
    </div>
  )
}
