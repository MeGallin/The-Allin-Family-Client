import { useId, useState } from 'react'
import { ZoomIn, ZoomOut } from 'lucide-react'
import type { FamilyMemory } from '../../../features/memories/types'
import { memoryPhotoSources, memoryPhotoUrl } from '../../../services/memories-api'
import { Icon } from '../../ui/Icon'
import { Modal } from '../../ui/Modal'
import { FamilyImage } from './FamilyImage'
import './MemoryPhotoViewer.css'

export default function MemoryPhotoViewer({
  memory,
  onClose,
}: {
  memory: FamilyMemory
  onClose: () => void
}) {
  const [zoomed, setZoomed] = useState(false)
  const id = useId()
  return (
    <Modal title={memory.title} onClose={onClose} className="memory-photo-viewer">
      <div className="memory-photo-viewer__tools">
        <button
          type="button"
          className="secondary"
          aria-pressed={zoomed}
          aria-controls={id}
          onClick={() => setZoomed(!zoomed)}
        >
          <Icon icon={zoomed ? ZoomOut : ZoomIn} /> {zoomed ? 'Fit photo' : 'Zoom in'}
        </button>
        <a href={memoryPhotoUrl(memory)} target="_blank" rel="noreferrer">
          Open original<span className="sr-only"> (opens in a new tab)</span>
        </a>
      </div>
      <div
        id={id}
        className={'memory-photo-viewer__canvas' + (zoomed ? ' is-zoomed' : '')}
        tabIndex={0}
        role="region"
        aria-label="Enlarged photo"
      >
        <FamilyImage
          {...memoryPhotoSources(memory)}
          src={memoryPhotoUrl(memory, 1600)}
          sizes={zoomed ? '200vw' : '100vw'}
          eager
          alt={memory.photoAlt || memory.title}
        />
      </div>
    </Modal>
  )
}
