import { lazy, Suspense, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { LockKeyhole, NotebookPen, Plus } from 'lucide-react'
import { useAppSelector } from '../../app/store-hooks'
import { usePersonalNotes } from '../../features/notes/usePersonalNotes'
import { noteSorts, notesView, type NoteSort } from '../../features/notes/notes-view'
import { PageHeader } from '../../components/ui/PageHeader'
import { CollectionToolbar } from '../../components/ui/CollectionToolbar'
import { Icon } from '../../components/ui/Icon'
import { LoadingState } from '../../components/ui/LoadingState'
import { EmptyState } from '../../components/ui/EmptyState'
import { ViewControls } from '../../components/ui/ViewControls'
import { NoteCard } from '../../components/notes/NoteCard'
import { NoteHistory } from '../../components/notes/NoteHistory'
import './PersonalNotesPage.css'
const NoteComposer = lazy(() => import('../../components/notes/NoteComposer'))
const NoteRemoval = lazy(() => import('../../components/notes/NoteRemoval'))
export default function PersonalNotesPage({ onSessionExpired }: { onSessionExpired: () => void }) {
  const { notes, activity, loading, pending, feedback, error, failure, refresh, clearError } =
    usePersonalNotes()
  const user = useAppSelector((state) => state.auth.user)
  const [search, setSearch] = useSearchParams()
  // Search text stays in memory rather than exposing private text in URLs/history.
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<NoteSort>('updated')
  useEffect(() => {
    if (failure?.status === 401 || failure?.code === 'password_change_required') onSessionExpired()
  }, [failure?.status, failure?.code, onSessionExpired])
  const visible = notesView(notes, query, sort)
  const editing = notes.find((note) => note.id === search.get('edit'))
  const removing = notes.find((note) => note.id === search.get('remove'))
  const missing =
    !loading && !error && (search.has('edit') || search.has('remove')) && !editing && !removing
  function resetView() {
    setQuery('')
    setSort('updated')
  }
  function close() {
    setSearch(
      (current) => {
        const next = new URLSearchParams(current)
        next.delete('compose')
        next.delete('edit')
        next.delete('remove')
        return next
      },
      { replace: true },
    )
    clearError()
  }
  return (
    <div className="page-stack page-enter personal-notes-page">
      <PageHeader
        title={(user?.familyName ?? 'Your') + (user ? '’s Personal Notes' : ' Personal Notes')}
        description="Your thoughts, plans and things to remember, saved just for you."
        action={
          <Link className="button-link" to="?compose=note" onClick={clearError}>
            <Icon icon={Plus} />
            New note
          </Link>
        }
      />
      {notes.length > 0 && (
        <ViewControls
          label="Your note filters and sorting"
          queryLabel="Search your notes"
          placeholder="Title or something you wrote"
          hint="Search titles, headers, bodies and footers."
          query={query}
          sort={sort}
          options={noteSorts}
          onQuery={setQuery}
          onSort={(value) => setSort(value as NoteSort)}
          onReset={resetView}
          active={!!query || sort !== 'updated'}
          count={visible.length}
          total={notes.length}
          noun="note"
        />
      )}
      <CollectionToolbar
        label="Refresh notes"
        busy={pending}
        feedback={feedback}
        onRefresh={refresh}
      >
        <p className="personal-notes-page__privacy">
          <Icon icon={LockKeyhole} />
          <span>Only you can view, edit or delete your notes.</span>
        </p>
      </CollectionToolbar>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <LoadingState label="Opening your private notebook…" />
      ) : notes.length === 0 ? (
        !error && (
          <EmptyState icon={NotebookPen} title="A little space for yourself">
            <p>
              Create your first note with a title, date, header, body and footer. Headers and
              footers are optional.
            </p>
          </EmptyState>
        )
      ) : visible.length === 0 ? (
        <EmptyState icon={NotebookPen} title="No matching notes">
          <p>Try another search or reset your view.</p>
          <button
            type="button"
            className="secondary"
            onClick={() => {
              resetView()
              document.getElementById('family-content')?.focus()
            }}
          >
            Reset view
          </button>
        </EmptyState>
      ) : (
        <div className="personal-notes-page__list">
          {visible.map((note) => (
            <NoteCard key={note.id} note={note} onAction={clearError} />
          ))}
        </div>
      )}
      <NoteHistory activity={activity} />
      {missing && (
        <div role="status">
          <p>This note is not available in your notebook.</p>
          <button type="button" className="secondary" onClick={close}>
            Back to notes
          </button>
        </div>
      )}
      {(search.get('compose') === 'note' || editing) && (
        <Suspense fallback={<LoadingState label="Opening your note…" />}>
          <NoteComposer key={editing?.id ?? 'new'} note={editing} onClose={close} />
        </Suspense>
      )}
      {removing && (
        <Suspense fallback={<LoadingState label="Opening note options…" />}>
          <NoteRemoval key={removing.id} note={removing} onClose={close} />
        </Suspense>
      )}
    </div>
  )
}
