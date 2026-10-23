import { useHashTarget } from '../../hooks/useHashTarget'
import { useFamilyData } from '../../features/family/useFamilyData'
import { PageHeader } from '../../components/ui/PageHeader'
import { WeekPlanner } from '../../components/family/home/WeekPlanner'
import { HomePriorities } from '../../components/family/home/HomePriorities'
import { HomeDestinations } from '../../components/family/home/HomeDestinations'
import './FamilyHomePage.css'

export default function FamilyHomePage() {
  const { user } = useFamilyData()
  const firstName = user.familyName
  useHashTarget()
  return (
    <div className="page-stack page-enter">
      <PageHeader
        title="The days ahead."
        description={'Hello, ' + firstName + '. Make room for what matters.'}
      />
      <div className="family-home-grid">
        <WeekPlanner />
        <HomePriorities />
      </div>
      <HomeDestinations name={firstName} />
    </div>
  )
}
