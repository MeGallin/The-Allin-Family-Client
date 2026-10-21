import { useRemovals } from '../../features/removals/useRemovals'
import { RemovalNotice } from '../removals/RemovalNotice'
import { Link } from 'react-router'
import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import type { PersonalNote } from '../../features/notes/types'
import { Icon } from '../ui/Icon'
import { FriendlyTime } from '../ui/FriendlyTime'
import { exactDate } from '../../lib/friendly-dates'
import { formatEventDay } from '../../lib/dates'
import { noteAppearance } from './note-appearance'
import { NotePin } from './NotePin'
import './NoteCard.css'
export function NoteCard({ note, onAction }: { note: PersonalNote; onAction: () => void }) {
  const { removals } = useRemovals('notes')
  const removal = removals[note.id]
  const [reading, setReading] = useState(false)
  const appearance = noteAppearance(note.id)
  return (
    <article className="note-card" data-paper={appearance.paper} data-tilt={appearance.tilt}>
      <NotePin />
      <span className="note-card__curl" aria-hidden="true" />
      <header>
        <p className="note-card__date">
          <time dateTime={note.noteDate}>{formatEventDay(note.noteDate + 'T00:00:00')}</time>
        </p>
        <h2>{note.title}</h2>
      </header>
      {!reading && (
        <p className="note-card__excerpt">
          {note.body.length > 180 ? note.body.slice(0, 180).trimEnd() + '…' : note.body}
        </p>
      )}
      <details
        className="note-card__reading"
        onToggle={(event) => setReading(event.currentTarget.open)}
      >
        <summary>Read full note</summary>
        {note.header && <p className="note-card__header">{note.header}</p>}
        <div className="note-card__body">{note.body}</div>
        {note.footer && <footer className="note-card__footer">{note.footer}</footer>}
      </details>
      <p className="note-card__meta">
        Created <FriendlyTime value={note.createdAt} />
        {note.version > 1 && (
          <>
            {' '}
            · Edited <FriendlyTime value={note.updatedAt} />
          </>
        )}
      </p>
      <details className="note-card__dates">
        <summary>Exact dates</summary>
        <p>
          Created: {exactDate(note.createdAt)}
          <br />
          Last edited: {exactDate(note.updatedAt)}
        </p>
      </details>
      <RemovalNotice removal={removal} />
      {!removal && (
        <div className="note-card__actions">
          <Link to={'?edit=' + note.id} onClick={onAction} aria-label={'Edit ' + note.title}>
            <Icon icon={Pencil} />
            Edit note
          </Link>
          <Link
            id={'notes-remove-' + note.id}
            to={'?remove=' + note.id}
            onClick={onAction}
            aria-label={'Delete ' + note.title}
          >
            <Icon icon={Trash2} />
            Delete note
          </Link>
        </div>
      )}
    </article>
  )
}
