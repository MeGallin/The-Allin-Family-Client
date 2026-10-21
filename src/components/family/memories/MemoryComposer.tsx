import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { useMemories } from '../../../features/memories/useMemories'
import type { FamilyMemory } from '../../../features/memories/types'
import { memoryPhotoUrl } from '../../../services/memories-api'
import { Modal } from '../../ui/Modal'
import './MemoryComposer.css'

export default function MemoryComposer({
  memory,
  onClose,
}: {
  memory?: FamilyMemory
  onClose: () => void
}) {
  const { add, edit, pending, error, clearError } = useMemories()
  const [original] = useState(memory)
  const id = useId()
  const [title, setTitle] = useState(memory?.title ?? '')
  const [story, setStory] = useState(memory?.story ?? '')
  const [photoAlt, setPhotoAlt] = useState(memory?.photoAlt ?? '')
  const [image, setImage] = useState<File | null>(null)
  const photoInput = useRef<HTMLInputElement>(null)
  const [removePhoto, setRemovePhoto] = useState(false)
  const [preview, setPreview] = useState('')
  const [validation, setValidation] = useState('')
  const failureNotice = useRef<HTMLParagraphElement>(null)
  const focusFailure = () => requestAnimationFrame(() => failureNotice.current?.focus())
  const addition = useRef<{ signature: string; file: File | null; key: string } | null>(null)
  const stale = !!original && original.version !== memory?.version
  useEffect(() => {
    if (!image) {
      setPreview('')
      return
    }
    const url = URL.createObjectURL(image)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [image])
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setValidation('')
    clearError()
    if (!title.trim() || (!story.trim() && !image && (!original?.photoKey || removePhoto))) {
      setValidation('Give your memory a title and add a photo or write a story.')
      focusFailure()
      return
    }
    if (
      image &&
      (!['image/jpeg', 'image/png', 'image/webp'].includes(image.type) ||
        image.size > 10 * 1024 * 1024)
    ) {
      setValidation('Choose a JPG, PNG or WebP photo up to 10 MB.')
      focusFailure()
      return
    }
    const draft = {
      title: title.trim(),
      story: story.trim(),
      photoAlt: photoAlt.trim(),
      removePhoto,
    }
    const signature = JSON.stringify(draft)
    if (
      !addition.current ||
      addition.current.signature !== signature ||
      addition.current.file !== image
    ) {
      addition.current = { signature, file: image, key: crypto.randomUUID() }
    }
    const saved = original
      ? await edit(original, draft, image ?? undefined)
      : await add(draft, addition.current.key, image ?? undefined)
    if (saved) onClose()
    else focusFailure()
  }
  const photo = preview || (!removePhoto && original?.photoKey ? memoryPhotoUrl(original) : '')
  const problem =
    validation ||
    (stale
      ? 'Someone changed this memory while you were editing. Your draft is still here. Close and reopen the edit to use the latest version.'
      : error)
  return (
    <Modal
      title={original ? 'Edit this memory' : 'Share a moment'}
      onClose={onClose}
      busy={pending}
    >
      <p className="note">Share a photo, a story, or both. Saved for everyone in the family.</p>
      <form onSubmit={submit} className="memory-composer" aria-busy={pending}>
        <fieldset disabled={pending}>
          <label htmlFor={id + '-title'}>Give it a title</label>
          <input
            id={id + '-title'}
            required
            maxLength={80}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            autoComplete="off"
          />
          <label htmlFor={id + '-story'}>
            Your story <span className="field-optional">(optional with a photo)</span>
          </label>
          <textarea
            id={id + '-story'}
            rows={7}
            maxLength={5000}
            value={story}
            onChange={(event) => setStory(event.target.value)}
            aria-describedby={id + '-story-help'}
          />
          <p id={id + '-story-help'} className="note">
            {story.length.toLocaleString('en-GB')} / 5,000 characters
          </p>
          <label htmlFor={id + '-photo'}>
            {original?.photoKey ? 'Replace the photo' : 'Choose a photo'}{' '}
            <span className="field-optional">(optional with a story)</span>
          </label>
          <input
            id={id + '-photo'}
            ref={photoInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            aria-describedby={id + '-photo-help'}
            onChange={(event) => {
              setImage(event.target.files?.[0] ?? null)
              setRemovePhoto(false)
            }}
          />
          <p id={id + '-photo-help'} className="note">
            JPG, PNG or WebP, up to 10 MB and 24 megapixels. Photos are visible only after family
            sign-in.
          </p>
          {photo && (
            <img
              className="memory-composer__preview"
              src={photo}
              alt={photoAlt.trim() || title.trim() || 'Selected photo preview'}
            />
          )}
          {(image || original?.photoKey) && !removePhoto && (
            <>
              <label htmlFor={id + '-alt'}>
                Photo description <span className="field-optional">(optional)</span>
              </label>
              <input
                id={id + '-alt'}
                maxLength={160}
                value={photoAlt}
                onChange={(event) => setPhotoAlt(event.target.value)}
                aria-describedby={id + '-alt-help'}
              />
              <p id={id + '-alt-help'} className="note">
                Describe what is in the photo for anyone using a screen reader. The title is used if
                left blank.
              </p>
            </>
          )}
          {original?.photoKey && (
            <label className="memory-composer__remove-photo">
              <input
                type="checkbox"
                checked={removePhoto}
                onChange={(event) => {
                  setRemovePhoto(event.target.checked)
                  if (event.target.checked) {
                    setImage(null)
                    if (photoInput.current) photoInput.current.value = ''
                  }
                }}
              />
              Remove the current photo
            </label>
          )}
        </fieldset>
        {problem && (
          <p ref={failureNotice} tabIndex={-1} role="alert" className="error">
            {problem}
          </p>
        )}
        <div className="actions">
          <button type="submit" disabled={pending || stale}>
            {pending ? 'Saving…' : original ? 'Save changes' : 'Share memory'}
          </button>
          <button type="button" className="secondary" disabled={pending} onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  )
}
