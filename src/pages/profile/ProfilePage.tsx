import { CloudSun, LockKeyhole, Palette, TrainFront, UserRound } from 'lucide-react'
import { useSearchParams } from 'react-router'
import { useAppSelector } from '../../app/store-hooks'
import { PageHeader } from '../../components/ui/PageHeader'
import { Tabs, type TabItem } from '../../components/ui/Tabs'
import { Icon } from '../../components/ui/Icon'
import { ProfileAppearance } from '../../components/profile/ProfileAppearance'
import { ProfileIdentity } from '../../components/profile/ProfileIdentity'
import { ProfileSection } from '../../components/profile/ProfileSection'
import { NicknameForm } from '../../components/profile/NicknameForm'
import { WeekPreferencesForm } from '../../components/profile/WeekPreferencesForm'
import { TravelPreferencesForm } from '../../components/profile/TravelPreferencesForm'
import './ProfilePage.css'

const sections = [
  {
    id: 'identity',
    label: 'About you',
    icon: UserRound,
    title: 'About you',
    description: 'A familiar name for the people who know you.',
  },
  {
    id: 'appearance',
    label: 'Appearance',
    icon: Palette,
    title: 'Your finishing touch',
    description: 'One accent, chosen by you.',
  },
  {
    id: 'weather',
    label: 'Week Ahead',
    icon: CloudSun,
    title: 'Your Week Ahead',
    description: 'Local information, wherever you are.',
  },
  {
    id: 'travel',
    label: 'TfL lines',
    icon: TrainFront,
    title: 'Your TfL lines',
    description: 'The lines you use, on your calendar.',
  },
] satisfies (TabItem & { title: string; description: string })[]

export default function ProfilePage() {
  const user = useAppSelector((state) => state.auth.user)
  const [params, setParams] = useSearchParams()
  const section = sections.find((item) => item.id === params.get('view')) ?? sections[1]
  if (!user) return null
  return (
    <div className="page-stack profile-page">
      <PageHeader title="Your profile" description="Your name. Your own finishing touch." />
      <div className="profile-studio">
        <ProfileIdentity user={user} />
        <Tabs
          items={sections}
          value={section.id}
          label="Profile sections"
          onChange={(view) => {
            if (view === section.id) return
            const next = new URLSearchParams(params)
            next.set('view', view)
            // The shared router blocker protects dirty/busy forms when `view` changes.
            setParams(next, { preventScrollReset: true })
          }}
        >
          <ProfileSection
            icon={section.icon}
            title={section.title}
            description={section.description}
          >
            {section.id === 'identity' && <NicknameForm profile={user} />}
            {section.id === 'appearance' && <ProfileAppearance name={user.familyName} />}
            {section.id === 'weather' && <WeekPreferencesForm />}
            {section.id === 'travel' && <TravelPreferencesForm />}
          </ProfileSection>
        </Tabs>
      </div>
      <div className="profile-page__privacy">
        <Icon icon={LockKeyhole} />
        <p>
          Family administrators can see sign-in counts, estimated active time and the last section
          visited. Your personal note contents stay private.
        </p>
      </div>
    </div>
  )
}
