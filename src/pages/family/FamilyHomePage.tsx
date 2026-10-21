import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { useFamilyData } from '../../features/family/useFamilyData'
import { PageHeader } from '../../components/ui/PageHeader'
import { QuickActions } from '../../components/family/QuickActions'
import { MemoryPreview } from '../../components/family/memories/MemoryPreview'
import { UpcomingPlans } from '../../components/family/calendar/UpcomingPlans'
import { ShoppingPreview } from '../../components/family/shopping/ShoppingPreview'
import { FamilyPoll } from '../../components/family/polls/FamilyPoll'
import './FamilyHomePage.css'

export default function FamilyHomePage() {
  const { user } = useFamilyData()
  const location = useLocation()
  const firstName = user.familyName
  useEffect(() => {
    if (location.hash === '#family-poll') {
      document.getElementById('family-poll')?.scrollIntoView({
        block: 'center',
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'instant'
          : 'smooth',
      })
    }
  }, [location.hash, location.key])
  return (
    <div className="page-stack page-enter">
      <PageHeader
        title={'Hello, ' + firstName + '.'}
        description="A little planning. A lot of family."
      />
      <QuickActions />
      <div className="family-home-grid">
        <MemoryPreview />
        <UpcomingPlans />
        <ShoppingPreview />
        <FamilyPoll />
      </div>
      <p className="family-home-footer">A private space for the people who matter.</p>
    </div>
  )
}
