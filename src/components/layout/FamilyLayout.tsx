import { Suspense, useLayoutEffect } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { ShieldCheck, FlaskConical } from 'lucide-react'
import type { FamilyUser } from '../../types/auth'
import { Icon } from '../ui/Icon'
import { AccountMenu } from './AccountMenu'
import { FamilyNavigation } from './FamilyNavigation'
import { LoadingState } from '../ui/LoadingState'
import './FamilyLayout.css'

type Props = {
  user: FamilyUser
  onChangePassword: () => void
  onLogout: () => void
  loggingOut: boolean
  error: string
}

export function FamilyLayout({ user, onChangePassword, onLogout, loggingOut, error }: Props) {
  const location = useLocation()
  useLayoutEffect(() => {
    document.getElementById('family-content')?.focus({ preventScroll: true })
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname])

  return (
    <div className="family-layout">
      <a className="skip-link" href="#family-content">
        Skip to content
      </a>
      <aside className="family-layout__sidebar">
        <Link to="/" className="family-brand" aria-label="The Allin Family home">
          <span className="family-brand__mark">A</span>
          <span>Allin.</span>
        </Link>
        <FamilyNavigation />
        {user.role === 'admin' && (
          <NavLink to="/admin" className="family-layout__admin">
            <Icon icon={ShieldCheck} />
            Administration
          </NavLink>
        )}
      </aside>
      <div className="family-layout__workspace">
        <header className="family-layout__header">
          <Link to="/" className="family-brand">
            <span className="family-brand__mark family-brand__mark--mobile">A</span>
            <span>{import.meta.env.VITE_APP_NAME || 'The Allin Family'}</span>
          </Link>
          <AccountMenu
            user={user}
            onChangePassword={onChangePassword}
            onLogout={onLogout}
            loggingOut={loggingOut}
          />
        </header>
        <div className="family-layout__notice">
          <Icon icon={FlaskConical} />
          <p>
            <strong>Home preview</strong> You’re trying sample content. Changes stay in this tab and
            reset on refresh.
          </p>
        </div>
        <main id="family-content" className="family-layout__content" tabIndex={-1}>
          {error && (
            <p className="feedback feedback--error" role="alert">
              {error}
            </p>
          )}
          <Suspense fallback={<LoadingState label="Opening this page…" />}>
            <Outlet />
          </Suspense>
        </main>
        <FamilyNavigation mobile />
      </div>
    </div>
  )
}
