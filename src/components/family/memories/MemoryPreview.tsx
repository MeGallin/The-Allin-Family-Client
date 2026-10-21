import { Link } from 'react-router'
import { Images } from 'lucide-react'
import { useMemories } from '../../../features/memories/useMemories'
import { MemoryCard } from './MemoryCard'
import { EmptyState } from '../../ui/EmptyState'
import { LoadingState } from '../../ui/LoadingState'
export function MemoryPreview() {
  const { memories, loading, error, feedback, refresh } = useMemories()
  return (
    <section aria-label="Latest family memory">
      {error && (
        <p className="error" role="alert">
          {error}{' '}
          <button type="button" className="secondary" onClick={refresh}>
            Try again
          </button>
        </p>
      )}
      {loading ? (
        <LoadingState label="Loading family memories…" />
      ) : memories[0] ? (
        <MemoryCard memory={memories[0]} featured />
      ) : (
        !error && (
          <div className="surface-card">
            <EmptyState icon={Images} title="Your family stories start here">
              <p>
                <Link to="/memories?compose=memory">Share the first moment</Link>
              </p>
            </EmptyState>
          </div>
        )
      )}
      <p role="status" className="note">
        {feedback}
      </p>
    </section>
  )
}
