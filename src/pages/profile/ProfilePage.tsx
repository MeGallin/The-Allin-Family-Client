import { useAppSelector } from '../../app/store-hooks'
import { PageHeader } from '../../components/ui/PageHeader'
import { Panel } from '../../components/ui/Panel'
import { AccentPicker } from '../../components/profile/AccentPicker'
import { NicknameForm } from '../../components/profile/NicknameForm'
import { WeekPreferencesForm } from '../../components/profile/WeekPreferencesForm'
import './ProfilePage.css'
export default function ProfilePage() {
  const user = useAppSelector((state) => state.auth.user)
  if (!user) return null
  return (
    <div className="page-stack page-enter profile-page">
      <PageHeader title="Your profile" description="Your name. Your own finishing touch." />
      <Panel title="Your nickname">
        <p className="note">
          Currently shown as <strong>{user.familyName}</strong>. Your username is {user.username}.
        </p>
        <NicknameForm profile={user} />
      </Panel>
      <Panel title="Make it yours">
        <AccentPicker />
      </Panel>
      <Panel title="Your Week Ahead">
        <WeekPreferencesForm />
      </Panel>
      <p className="note">
        Family administrators can see sign-in counts, estimated active time and the last section
        visited. Your personal note contents stay private.
      </p>
    </div>
  )
}
