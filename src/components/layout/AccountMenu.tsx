import { useEffect, useRef } from 'react'
import { KeyRound, LogOut, ShieldCheck, UserRound } from 'lucide-react'
import { Link } from 'react-router'
import type { FamilyUser } from '../../types/auth'
import { Icon } from '../ui/Icon'
import './AccountMenu.css'

type Props = {
  user: FamilyUser
  onChangePassword: () => void
  onLogout: () => void
  loggingOut: boolean
}

export function AccountMenu({ user, onChangePassword, onLogout, loggingOut }: Props) {
  const ref = useRef<HTMLDetailsElement>(null)
  useEffect(() => {
    function outside(event: PointerEvent) {
      if (event.target instanceof Node && !ref.current?.contains(event.target) && ref.current)
        ref.current.open = false
    }
    function escape(event: KeyboardEvent) {
      if (event.key === 'Escape' && ref.current?.open) {
        ref.current.open = false
        ref.current.querySelector('summary')?.focus()
      }
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('keydown', escape)
    }
  }, [])
  function close() {
    if (ref.current) ref.current.open = false
  }
  return (
    <details className="account-menu" ref={ref}>
      <summary aria-label={'Account options for ' + user.familyName}>
        <span className="account-menu__avatar">
          {Array.from(user.familyName)[0]?.toUpperCase() || 'A'}
        </span>
      </summary>
      <div className="account-menu__popover">
        <p className="account-menu__identity">
          Signed in as <strong>{user.familyName}</strong>
        </p>
        <Link to="/profile" onClick={close}>
          <Icon icon={UserRound} />
          Your profile
        </Link>
        {user.role === 'admin' && (
          <Link to="/admin" onClick={close}>
            <Icon icon={ShieldCheck} />
            Administration
          </Link>
        )}
        <button
          type="button"
          onClick={() => {
            close()
            onChangePassword()
          }}
        >
          <Icon icon={KeyRound} />
          Change password
        </button>
        <button
          type="button"
          disabled={loggingOut}
          onClick={() => {
            close()
            onLogout()
          }}
        >
          <Icon icon={LogOut} />
          {loggingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </details>
  )
}
