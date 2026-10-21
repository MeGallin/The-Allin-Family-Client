import { useAppSelector } from '../../app/store-hooks'
import { PageHeader } from '../../components/ui/PageHeader'
import { Panel } from '../../components/ui/Panel'
import { NicknameForm } from '../../components/profile/NicknameForm'
import './ProfilePage.css'
export default function ProfilePage() {
  const user = useAppSelector((state) => state.auth.user)
  if (!user) return null
  return (
    <div className="page-stack page-enter profile-page">
      <PageHeader title="Your profile" description="Choose the name your family sees." />
      <Panel title="Your nickname">
        <p className="note">
          Currently shown as <strong>{user.familyName}</strong>. Your username is {user.username}.
        </p>
        <NicknameForm profile={user} />
      </Panel>
    </div>
  )
}
