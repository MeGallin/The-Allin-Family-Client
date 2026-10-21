import { useEffect } from 'react'
import { useLocation, Link } from 'react-router'
import { Images } from 'lucide-react'
import { useFamilyData } from '../../features/family/useFamilyData'
import { PageHeader } from '../../components/ui/PageHeader'
import { QuickActions } from '../../components/family/QuickActions'
import { MemoryCard } from '../../components/family/memories/MemoryCard'
import { UpcomingPlans } from '../../components/family/calendar/UpcomingPlans'
import { ShoppingPreview } from '../../components/family/shopping/ShoppingPreview'
import { FamilyPoll } from '../../components/family/polls/FamilyPoll'
import { EmptyState } from '../../components/ui/EmptyState'
import './FamilyHomePage.css'

export default function FamilyHomePage() {
  const { user, memories } = useFamilyData()
  const location = useLocation()
  const firstName = user.displayName.trim().split(/\s+/)[0]
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
        {memories[0] ? (
          <MemoryCard memory={memories[0]} featured />
        ) : (
          <section className="surface-card">
            <EmptyState icon={Images} title="Your family stories start here">
              <p>
                <Link to="/memories?compose=memory">Share the first moment</Link>
              </p>
            </EmptyState>
          </section>
        )}
        <UpcomingPlans />
        <ShoppingPreview />
        <FamilyPoll />
      </div>
      <p className="family-home-footer">A private space for the people who matter.</p>
    </div>
  )
}
