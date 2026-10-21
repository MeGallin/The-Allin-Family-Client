import { RemovalNotice } from '../../removals/RemovalNotice'
import { Link } from 'react-router'
import { useEffect, useRef } from 'react'
import { Heart, Pencil } from 'lucide-react'
import type { FamilyMemory } from '../../../features/memories/types'
import { useMemories } from '../../../features/memories/useMemories'
import { useAppSelector } from '../../../app/store-hooks'
import { memoryPhotoUrl } from '../../../services/memories-api'
import { exactDate } from '../../../lib/friendly-dates'
import { FriendlyTime } from '../../ui/FriendlyTime'
import { Icon } from '../../ui/Icon'
import { FamilyImage } from './FamilyImage'
import { MemoryStory } from './MemoryStory'
import './MemoryCard.css'

export function MemoryCard({
  memory,
  featured = false,
}: {
  memory: FamilyMemory
  featured?: boolean
}) {
  const { react, pending, clearError, removals } = useMemories()
  const removal = removals[memory.id]
  const reactionFocus = useRef<HTMLButtonElement | null>(null)
  useEffect(() => {
    if (!pending && reactionFocus.current?.isConnected) {
      reactionFocus.current.focus()
      reactionFocus.current = null
    }
  }, [pending, memory.liked])
  const user = useAppSelector((state) => state.auth.user)
  const canRemove = user?.id === memory.createdBy.id || user?.role === 'admin'
  return (
    <article className={'memory-card' + (featured ? ' memory-card--featured' : '')}>
      {memory.photoKey && (
        <FamilyImage
          key={memory.photoKey}
          src={memoryPhotoUrl(memory)}
          alt={memory.photoAlt || memory.title}
          eager={featured}
        />
      )}
      <div className="memory-card__content">
        <p className="memory-card__label">
          {memory.photoKey ? 'A family moment' : 'A family story'}
        </p>
        <h2>{memory.title}</h2>
        {memory.story && <MemoryStory key={memory.version} story={memory.story} />}
        <p className="memory-card__credit">
          Added by {memory.createdBy.displayName} · <FriendlyTime value={memory.createdAt} />
          {memory.version > 1 && (
            <>
              <br />
              Updated by {memory.updatedBy.displayName} · <FriendlyTime value={memory.updatedAt} />
            </>
          )}
        </p>
        <RemovalNotice removal={removal} />
        {!removal && (
          <footer className="memory-card__footer">
            <Link
              className="memory-card__edit"
              to={'/memories?edit=' + memory.id}
              aria-label={'Edit ' + memory.title}
              onClick={clearError}
            >
              <Icon icon={Pencil} />
              Edit memory
            </Link>
            <button
              type="button"
              className="memory-card__reaction"
              disabled={pending}
              aria-label={(memory.liked ? 'Remove love from ' : 'Love ') + memory.title}
              aria-pressed={memory.liked}
              onClick={(event) => {
                reactionFocus.current = event.currentTarget
                void react(memory)
              }}
            >
              <Icon icon={Heart} />
              <span>
                {memory.liked ? 'Loved' : 'Love this'} · {memory.reactions}
              </span>
            </button>
          </footer>
        )}
        <details className="memory-card__details">
          <summary>Memory details</summary>
          {memory.photoKey && (
            <p>
              <a href={memoryPhotoUrl(memory)} target="_blank" rel="noreferrer">
                View full photo (opens in a new tab)
              </a>
            </p>
          )}
          <p>
            Added by {memory.createdBy.displayName} on {exactDate(memory.createdAt)}.
          </p>
          <p>
            Last edited by {memory.updatedBy.displayName} on {exactDate(memory.updatedAt)}.
          </p>
          {canRemove && !removal && (
            <Link
              id={'memories-remove-' + memory.id}
              to={'/memories?remove=' + memory.id}
              onClick={clearError}
              aria-label={'Remove ' + memory.title}
            >
              Remove memory
            </Link>
          )}
        </details>
      </div>
    </article>
  )
}
