import { lazy, Suspense } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Camera, Images } from 'lucide-react'
import { useFamilyData } from '../../features/family/useFamilyData'
import { PageHeader } from '../../components/ui/PageHeader'
import { MemoryCard } from '../../components/family/memories/MemoryCard'
import { Icon } from '../../components/ui/Icon'
import { EmptyState } from '../../components/ui/EmptyState'
import { LoadingState } from '../../components/ui/LoadingState'
import './MemoriesPage.css'

const MemoryComposer = lazy(() => import('../../components/family/memories/MemoryComposer'))

export default function MemoriesPage() {
  const { memories } = useFamilyData()
  const [search, setSearch] = useSearchParams()
  function closeComposer() {
    setSearch(
      (current) => {
        const next = new URLSearchParams(current)
        next.delete('compose')
        return next
      },
      { replace: true },
    )
  }
  return (
    <div className="page-stack page-enter">
      <PageHeader
        title="Our memories"
        description="Photos, stories and little things worth keeping."
        action={
          <Link className="button-link" to="?compose=memory">
            <Icon icon={Camera} />
            Share a moment
          </Link>
        }
      />
      {memories.length ? (
        <div className="memories-grid">
          {memories.map((memory, index) => (
            <MemoryCard key={memory.id} memory={memory} featured={index === 0} />
          ))}
        </div>
      ) : (
        <EmptyState icon={Images} title="Make room for a memory">
          <p>Add a photo to start your family album.</p>
        </EmptyState>
      )}
      {search.get('compose') === 'memory' && (
        <Suspense fallback={<LoadingState label="Opening the photo form…" />}>
          <MemoryComposer onClose={closeComposer} />
        </Suspense>
      )}
    </div>
  )
}
