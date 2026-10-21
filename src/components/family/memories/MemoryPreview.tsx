import { Link } from 'react-router'
import { Images } from 'lucide-react'
import { useMemories } from '../../../features/memories/useMemories'
import { recentMemories } from '../../../features/family/home-view'
import { memoryPhotoUrl } from '../../../services/memories-api'
import { MemoryCard } from './MemoryCard'
import { FamilyImage } from './FamilyImage'
import { FriendlyTime } from '../../ui/FriendlyTime'
import { EmptyState } from '../../ui/EmptyState'
import { LoadingState } from '../../ui/LoadingState'
import './MemoryPreview.css'

export function MemoryPreview() {
  const { memories, loading, error, feedback, refresh } = useMemories()
  const recent = recentMemories(memories)
  return (
    <section className="memory-preview" aria-labelledby="home-memories-heading">
      <header className="memory-preview__header">
        <h2 id="home-memories-heading">Recent memories</h2>
        <Link to="/memories">View album</Link>
      </header>
      {error && (
        <div>
          <p className="error" role="alert">
            {error}
          </p>
          <button type="button" className="secondary" onClick={refresh}>
            Try again
          </button>
        </div>
      )}
      {loading ? (
        <LoadingState label="Loading family memories…" />
      ) : recent[0] ? (
        <>
          <MemoryCard memory={recent[0]} featured headingLevel={3} />
          {recent.length > 1 && (
            <ul className="memory-preview__recent">
              {recent.slice(1).map((memory) => (
                <li key={memory.id}>
                  <Link to={'/memories#memory-' + memory.id}>
                    {memory.photoKey && (
                      <span className="memory-preview__thumbnail">
                        <FamilyImage src={memoryPhotoUrl(memory)} alt="" />
                      </span>
                    )}
                    <span className="memory-preview__copy">
                      <strong>{memory.title}</strong>
                      <span>
                        {memory.createdBy.displayName} · <FriendlyTime value={memory.createdAt} />
                      </span>
                      {memory.story && (
                        <span className="memory-preview__excerpt">{memory.story}</span>
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
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
      {feedback && (
        <p role="status" className="note">
          {feedback}
        </p>
      )}
    </section>
  )
}
