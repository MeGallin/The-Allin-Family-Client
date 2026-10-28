import { Link } from 'react-router'
import { ArrowUpRight, Images, NotebookPen } from 'lucide-react'
import { useMemories } from '../../../features/memories/useMemories'
import { recentMemories } from '../../../features/family/home-view'
import { memoryPhotoSources } from '../../../services/memories-api'
import { FamilyImage } from '../memories/FamilyImage'
import { FriendlyTime } from '../../ui/FriendlyTime'
import { Icon } from '../../ui/Icon'
import { HomeDataError } from './HomeDataError'
import './HomeDestinations.css'

export function HomeDestinations({ name }: { name: string }) {
  const { memories, loading, error, refresh } = useMemories()
  const memory = recentMemories(memories)[0]
  return (
    <>
      <div className="home-index-item">
        <HomeDataError error={error} retry={refresh} />
        <Link
          className="home-index-row"
          to={memory ? '/memories#memory-' + memory.id : '/memories'}
        >
          <span className="home-index-row__glyph home-index-memory">
            {memory?.photoKey ? (
              <FamilyImage {...memoryPhotoSources(memory, true)} alt="" />
            ) : (
              <Icon icon={Images} />
            )}
          </span>
          <span className="home-index-row__label">
            <strong>From our memories</strong>
            <small>The family album</small>
          </span>
          <span className="home-index-row__status">
            <small className="home-index-row__caption">Latest memory</small>
            <strong>
              {loading
                ? 'Loading memories…'
                : (memory?.title ?? (error ? 'Open family album' : 'Room for your next memory'))}
            </strong>
            {memory && (
              <span>
                Added by {memory.createdBy.displayName} · <FriendlyTime value={memory.createdAt} />
              </span>
            )}
          </span>
          <span className="home-index-row__action">
            View <Icon icon={ArrowUpRight} />
          </span>
        </Link>
      </div>
      <Link className="home-index-item home-index-row" to="/notes">
        <span className="home-index-row__glyph">
          <Icon icon={NotebookPen} />
        </span>
        <span className="home-index-row__label">
          <strong>{name}’s personal notes</strong>
        </span>
        <span className="home-index-row__status">
          <small className="home-index-row__caption">Only for you</small>
          <span>A private space for your thoughts</span>
        </span>
        <span className="home-index-row__action">
          Open <Icon icon={ArrowUpRight} />
        </span>
      </Link>
    </>
  )
}
