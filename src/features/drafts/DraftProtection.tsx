import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useBlocker } from 'react-router'
import { Modal } from '../../components/ui/Modal'

type Entry = { dirty: boolean; busy: boolean }
type Protection = {
  update: (id: string, entry: Entry | null) => void
  protect: (action: () => void, id?: string) => void
  complete: (action: () => void, id: string) => void
}
const Context = createContext<Protection | null>(null)

/** One router blocker for every editor, including pages with several dirty forms. */
export function DraftProtectionProvider({ children }: { children: ReactNode }) {
  const entries = useRef(new Map<string, Entry>())
  const permitted = useRef(false)
  const [revision, changed] = useReducer((value: number) => value + 1, 0)
  const [pending, setPending] = useState<{ action: () => void; id?: string } | null>(null)
  const relevant = (id?: string) =>
    [...entries.current].filter(([key]) => !id || key === id).map(([, entry]) => entry)
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    if (permitted.current || !relevant().some((entry) => entry.dirty || entry.busy)) return false
    if (currentLocation.pathname !== nextLocation.pathname) return true
    const current = new URLSearchParams(currentLocation.search)
    const next = new URLSearchParams(nextLocation.search)
    // Filters and anchors keep mounted drafts; editor and admin-view changes can close them.
    return ['compose', 'edit', 'remove', 'view'].some((key) => current.get(key) !== next.get(key))
  })
  const blockerRef = useRef(blocker)
  useEffect(() => {
    blockerRef.current = blocker
  }, [blocker])
  const allow = useCallback((action: () => void) => {
    permitted.current = true
    try {
      action()
    } finally {
      permitted.current = false
    }
  }, [])
  const update = useCallback((id: string, entry: Entry | null) => {
    const previous = entries.current.get(id)
    if (!entry && !previous) return
    if (entry && previous?.dirty === entry.dirty && previous?.busy === entry.busy) return
    if (entry) entries.current.set(id, entry)
    else entries.current.delete(id)
    changed()
  }, [])
  const protect = useCallback(
    (action: () => void, id?: string) => {
      const active = [...entries.current].some(
        ([key, entry]) => (!id || key === id) && (entry.dirty || entry.busy),
      )
      if (active) setPending({ action, id })
      else allow(action)
    },
    [allow],
  )
  const complete = useCallback(
    (action: () => void, id: string) => {
      entries.current.delete(id)
      setPending(null)
      // A successful save cancels a navigation requested while the form was busy.
      if (blockerRef.current.state === 'blocked') blockerRef.current.reset?.()
      allow(action)
    },
    [allow],
  )
  const value = useMemo(() => ({ update, protect, complete }), [update, protect, complete])
  useEffect(() => {
    const unload = (event: BeforeUnloadEvent) => {
      if (
        !permitted.current &&
        [...entries.current.values()].some((entry) => entry.dirty || entry.busy)
      ) {
        event.preventDefault()
        event.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', unload)
    return () => window.removeEventListener('beforeunload', unload)
  }, [])
  const showing = pending !== null || blocker.state === 'blocked'
  const saving = relevant(pending?.id).some((entry) => entry.busy)
  useEffect(() => {
    // An editor may unmount after an in-flight save; cancel its old leave prompt.
    if (relevant(pending?.id).some((entry) => entry.dirty || entry.busy)) return
    if (pending) setPending(null)
    if (blocker.state === 'blocked') blocker.reset()
  }, [revision, pending, blocker])
  function keep() {
    setPending(null)
    if (blocker.state === 'blocked') blocker.reset()
  }
  function discard() {
    if (saving) return
    const action = pending?.action
    setPending(null)
    if (action) allow(action)
    else if (blocker.state === 'blocked') blocker.proceed()
  }
  return (
    <Context.Provider value={value}>
      {children}
      {showing && (
        <Modal title={saving ? 'Changes are saving' : 'Discard unsaved changes?'} onClose={keep}>
          <p>
            {saving
              ? 'Wait for saving to finish before leaving this form.'
              : 'Your unsaved changes will be lost if you leave. Stay here to keep editing.'}
          </p>
          <div className="actions">
            <button type="button" onClick={keep} data-modal-autofocus>
              Keep editing
            </button>
            {!saving && (
              <button type="button" className="secondary" onClick={discard}>
                Discard changes
              </button>
            )}
          </div>
        </Modal>
      )}
    </Context.Provider>
  )
}
export function useDraftProtection() {
  const context = useContext(Context)
  if (!context) throw new Error('Draft protection requires the family router')
  return context
}
export function useDraftGuard(dirty: boolean, busy = false) {
  const id = useId()
  const { update, protect, complete } = useDraftProtection()
  useEffect(() => {
    update(id, dirty || busy ? { dirty, busy } : null)
    return () => update(id, null)
  }, [id, dirty, busy, update])
  return {
    close: (action: () => void) => protect(action, id),
    complete: (action: () => void) => complete(action, id),
  }
}
