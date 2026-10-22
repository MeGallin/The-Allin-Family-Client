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
    <div className="home-destinations">
      <div>
        <HomeDataError error={error} retry={refresh} />
        <Link
          className="home-destination"
          to={memory ? '/memories#memory-' + memory.id : '/memories'}
        >
          <span className="home-destination__glyph">
            {memory?.photoKey ? (
              <FamilyImage {...memoryPhotoSources(memory, true)} alt="" />
            ) : (
              <Icon icon={Images} />
            )}
          </span>
          <span className="home-destination__copy">
            <small>From our memories</small>
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
          <Icon icon={ArrowUpRight} />
        </Link>
      </div>
      <Link className="home-destination" to="/notes">
        <span className="home-destination__glyph">
          <Icon icon={NotebookPen} />
        </span>
        <span className="home-destination__copy">
          <small>Only for you</small>
          <strong>{name}’s personal notes</strong>
          <span>A private space for your thoughts</span>
        </span>
        <Icon icon={ArrowUpRight} />
      </Link>
    </div>
  )
}
