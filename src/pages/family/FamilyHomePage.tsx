import { useHashTarget } from '../../hooks/useHashTarget'
import { useFamilyData } from '../../features/family/useFamilyData'
import { PageHeader } from '../../components/ui/PageHeader'
import { QuickActions } from '../../components/family/QuickActions'
import { HomeOverview } from '../../components/family/HomeOverview'
import { MemoryPreview } from '../../components/family/memories/MemoryPreview'
import { UpcomingPlans } from '../../components/family/calendar/UpcomingPlans'
import { ShoppingPreview } from '../../components/family/shopping/ShoppingPreview'
import { FamilyPoll } from '../../components/family/polls/FamilyPoll'
import './FamilyHomePage.css'

export default function FamilyHomePage() {
  const { user } = useFamilyData()
  const firstName = user.familyName
  useHashTarget()
  return (
    <div className="page-stack page-enter">
      <PageHeader
        title={'Hello, ' + firstName + '.'}
        description="A little planning. A lot of family."
      />
      <HomeOverview />
      <div className="family-home-grid">
        <ShoppingPreview />
        <UpcomingPlans />
        <FamilyPoll />
        <MemoryPreview />
      </div>
      <QuickActions />
      <p className="family-home-footer">A private space for the people who matter.</p>
    </div>
  )
}
