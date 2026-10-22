import { Link } from 'react-router'
import { Images } from 'lucide-react'
import { useMemories } from '../../../features/memories/useMemories'
import { recentMemories } from '../../../features/family/home-view'
import { memoryPhotoUrl } from '../../../services/memories-api'
import { FamilyImage } from './FamilyImage'
import { FriendlyTime } from '../../ui/FriendlyTime'
import { Icon } from '../../ui/Icon'
import { Panel } from '../../ui/Panel'
import { LoadingState } from '../../ui/LoadingState'
import './MemoryPreview.css'

export function MemoryPreview() {
  const { memories, loading, error, refresh } = useMemories()
  const recent = recentMemories(memories)
  return (
    <Panel
      title="Recent memories"
      action={<Link to="/memories">View album</Link>}
      className="memory-preview"
    >
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
      ) : recent.length ? (
        <ul className="memory-preview__recent">
          {recent.map((memory) => (
            <li key={memory.id}>
              <Link
                to={'/memories#memory-' + memory.id}
                aria-label={'Open memory: ' + memory.title}
              >
                <span className="memory-preview__thumbnail">
                  {memory.photoKey ? (
                    <FamilyImage src={memoryPhotoUrl(memory)} alt="" />
                  ) : (
                    <Icon icon={Images} />
                  )}
                </span>
                <span className="memory-preview__copy">
                  <span className="memory-preview__title">{memory.title}</span>
                  {memory.story && <span className="memory-preview__excerpt">{memory.story}</span>}
                  <span className="memory-preview__meta">
                    {memory.createdBy.displayName} · <FriendlyTime value={memory.createdAt} />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        !error && (
          <p className="memory-preview__empty">
            <Link to="/memories?compose=memory">Share the first family moment</Link>
          </p>
        )
      )}
    </Panel>
  )
}
