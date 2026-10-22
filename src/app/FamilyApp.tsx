import { useFamilyHome } from '../hooks/useFamilyHome'
import { LoadingState } from '../components/ui/LoadingState'
import { useAppSelector } from './store-hooks'
import { FamilyRouter } from './FamilyRouter'
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
    <FamilyRouter user={user ?? home.user} onSessionExpired={onSessionExpired} {...layoutProps} />
  )
}
