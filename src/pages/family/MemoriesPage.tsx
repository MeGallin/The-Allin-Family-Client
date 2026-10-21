import { lazy, Suspense } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Camera, Images, RefreshCw } from 'lucide-react'
import { useMemories } from '../../features/memories/useMemories'
import { PageHeader } from '../../components/ui/PageHeader'
import { MemoryCard } from '../../components/family/memories/MemoryCard'
import { MemoryActivity } from '../../components/family/memories/MemoryActivity'
import { Icon } from '../../components/ui/Icon'
import { EmptyState } from '../../components/ui/EmptyState'
import { LoadingState } from '../../components/ui/LoadingState'
import './MemoriesPage.css'

const MemoryComposer = lazy(() => import('../../components/family/memories/MemoryComposer'))
const MemoryRemoval = lazy(() => import('../../components/family/memories/MemoryRemoval'))
export default function MemoriesPage() {
  const { memories, loading, error, feedback, pending, refresh, clearError } = useMemories()
  const [search, setSearch] = useSearchParams()
  const editing = memories.find((memory) => memory.id === search.get('edit'))
  const removing = memories.find((memory) => memory.id === search.get('remove'))
  const missing = !loading && (search.has('edit') || search.has('remove')) && !editing && !removing
  function closeComposer() {
    setSearch(
      (current) => {
        const next = new URLSearchParams(current)
        next.delete('compose')
        next.delete('edit')
        next.delete('remove')
        return next
      },
      { replace: true },
    )
    clearError()
  }
  return (
    <div className="page-stack page-enter">
      <PageHeader
        title="Our memories"
        description="Photos, stories and little things worth keeping. Shared and saved for the family."
        action={
          <Link className="button-link" to="?compose=memory" onClick={clearError}>
            <Icon icon={Camera} />
            Share a moment
          </Link>
        }
      />
      <div className="memories-page__status">
        <p role="status" className="note">
          {feedback ||
            (loading
              ? 'Opening the family album…'
              : `${memories.length} ${memories.length === 1 ? 'memory' : 'memories'}`)}
        </p>
        <button type="button" className="secondary" onClick={refresh} disabled={pending}>
          <Icon icon={RefreshCw} />
          Refresh memories
        </button>
      </div>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {loading ? (
        <LoadingState label="Loading family memories…" />
      ) : memories.length ? (
        <div className="memories-grid">
          {memories.map((memory, index) => (
            <MemoryCard key={memory.id} memory={memory} featured={index === 0} />
          ))}
        </div>
      ) : (
        !error && (
          <EmptyState icon={Images} title="Make room for a memory">
            <p>Share a photo, a story, or both to start your family album.</p>
          </EmptyState>
        )
      )}
      <MemoryActivity />
      {missing && (
        <div role="status">
          <p>This memory is no longer available. It may have been removed.</p>
          <button type="button" className="secondary" onClick={closeComposer}>
            Back to memories
          </button>
        </div>
      )}
      {(search.get('compose') === 'memory' || editing) && (
        <Suspense fallback={<LoadingState label="Opening the memory form…" />}>
          <MemoryComposer key={editing?.id ?? 'new'} memory={editing} onClose={closeComposer} />
        </Suspense>
      )}
      {removing && (
        <Suspense fallback={<LoadingState label="Opening memory options…" />}>
          <MemoryRemoval memory={removing} onClose={closeComposer} />
        </Suspense>
      )}
    </div>
  )
}
