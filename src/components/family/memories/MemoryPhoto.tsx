import { lazy, Suspense, useState } from 'react'
import { Expand } from 'lucide-react'
import type { FamilyMemory } from '../../../features/memories/types'
import { memoryPhotoSources } from '../../../services/memories-api'
import { Icon } from '../../ui/Icon'
import { FamilyImage } from './FamilyImage'
import './MemoryPhoto.css'

const MemoryPhotoViewer = lazy(() => import('./MemoryPhotoViewer'))

export function MemoryPhoto({ memory, eager = false }: { memory: FamilyMemory; eager?: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        className="memory-photo"
        aria-label={'Enlarge photo: ' + memory.title}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <FamilyImage
          {...memoryPhotoSources(memory)}
          alt={memory.photoAlt || memory.title}
          eager={eager}
        />
        <span className="memory-photo__hint" aria-hidden="true">
          <Icon icon={Expand} /> View photo
        </span>
      </button>
      {open && (
        <Suspense
          fallback={
            <p role="status" className="note">
              Opening photo…
            </p>
          }
        >
          <MemoryPhotoViewer memory={memory} onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </>
  )
}
