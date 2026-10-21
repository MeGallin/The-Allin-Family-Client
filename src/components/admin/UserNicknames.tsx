import { profileApi } from '../../services/profile-query'
import { shoppingError } from '../../services/shopping-query'
import { LoadingState } from '../ui/LoadingState'
import { NicknameForm } from '../profile/NicknameForm'
import './UserNicknames.css'
export function UserNicknames() {
  const { data, error, isLoading, refetch } = profileApi.useGetAdminUsersQuery(undefined)
  if (isLoading) return <LoadingState label="Loading family accounts…" />
  return (
    <section className="user-nicknames" aria-labelledby="user-nicknames-heading">
      <h2 id="user-nicknames-heading">Family nicknames</h2>
      <p className="note">Help anyone in the family update the name shown on family pages.</p>
      {error && (
        <div>
          <p className="error" role="alert">
            {shoppingError(error)?.message ?? 'Unable to load accounts.'}
          </p>
          <button
            type="button"
            className="secondary"
            onClick={() => {
              void refetch()
            }}
          >
            Try again
          </button>
        </div>
      )}
      <div className="user-nicknames__grid">
        {data?.users.map((profile) => (
          <section
            className="surface-card user-nicknames__card"
            key={profile.id}
            aria-label={'Nickname for ' + profile.displayName}
          >
            <h3>{profile.displayName}</h3>
            <p className="note">
              @{profile.username} · Shown as {profile.familyName}
            </p>
            <NicknameForm profile={profile} admin />
          </section>
        ))}
      </div>
      {data?.users.length === 0 && <p className="note">No active family accounts.</p>}
    </section>
  )
}
