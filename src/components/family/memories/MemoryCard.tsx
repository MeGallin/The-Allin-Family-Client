import { Heart } from 'lucide-react'
import type { FamilyMemory } from '../../../features/family/types'
import { useFamilyData } from '../../../features/family/useFamilyData'
import { Icon } from '../../ui/Icon'
import { FamilyImage } from './FamilyImage'
import './MemoryCard.css'

export function MemoryCard({
  memory,
  featured = false,
}: {
  memory: FamilyMemory
  featured?: boolean
}) {
  const { toggleReaction, user } = useFamilyData()
  const author = memory.authorId === user.id ? user.familyName : memory.author
  return (
    <article className={'memory-card' + (featured ? ' memory-card--featured' : '')}>
      <FamilyImage
        key={memory.imageUrl}
        src={memory.imageUrl}
        alt={memory.imageAlt}
        eager={featured}
      />
      <div className="memory-card__content">
        <p className="memory-card__label">
          {memory.sample ? 'Sample memory · Illustration' : 'A new moment · In this preview'}
        </p>
        <h2>{memory.title}</h2>
        <p className="memory-card__caption">{memory.caption}</p>
        <footer className="memory-card__footer">
          <div className="memory-card__author">
            <span aria-hidden="true">{Array.from(author)[0]?.toUpperCase()}</span>
            <span>{author}</span>
          </div>
          <button
            type="button"
            className="memory-card__reaction"
            aria-pressed={memory.liked}
            onClick={() => toggleReaction(memory.id)}
          >
            <Icon icon={Heart} />
            <span>
              {memory.liked ? 'Loved' : 'Love this'} · {memory.reactions}
            </span>
          </button>
        </footer>
      </div>
    </article>
  )
}
