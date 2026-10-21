import { useId, useState, type FormEvent } from 'react'
import { useFamilyData } from '../../../features/family/useFamilyData'
import { Modal } from '../../ui/Modal'
import './MemoryComposer.css'

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
const maxImageBytes = 10 * 1024 * 1024

export default function MemoryComposer({ onClose }: { onClose: () => void }) {
  const { addMemory } = useFamilyData()
  const id = useId()
  const [title, setTitle] = useState('')
  const [caption, setCaption] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [error, setError] = useState('')

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!title.trim() || !image) {
      setError('Add a title and choose a photo.')
      return
    }
    if (!allowedTypes.has(image.type) || image.size > maxImageBytes) {
      setError('Choose a JPG, PNG or WebP photo smaller than 10 MB.')
      return
    }
    addMemory({ title: title.trim(), caption: caption.trim(), image })
    onClose()
  }

  return (
    <Modal title="Share a moment" onClose={onClose}>
      <p className="note">
        Try a photo in this preview. It stays in this tab and resets when you refresh.
      </p>
      <form onSubmit={submit} className="memory-composer">
        <label htmlFor={id + '-title'}>Give it a title</label>
        <input
          id={id + '-title'}
          required
          maxLength={80}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          autoComplete="off"
        />
        <label htmlFor={id + '-photo'}>Choose a photo</label>
        <input
          id={id + '-photo'}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required
          aria-describedby={id + '-photo-help'}
          onChange={(event) => setImage(event.target.files?.[0] ?? null)}
        />
        <p id={id + '-photo-help'} className="note">
          JPG, PNG or WebP, up to 10 MB.
        </p>
        <label htmlFor={id + '-caption'}>
          A few words <span className="field-optional">(optional)</span>
        </label>
        <textarea
          id={id + '-caption'}
          rows={3}
          maxLength={500}
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
        />
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="actions">
          <button type="submit">Add to preview</button>
          <button type="button" className="secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  )
}
