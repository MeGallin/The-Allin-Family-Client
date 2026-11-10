import { useEffect } from 'react'
import { Link } from 'react-router'
import { useAppDispatch } from '../../app/store-hooks'
import { useNonograms } from '../../features/nonograms/useNonograms'
import { nonogramAccepted, nonogramDirty } from '../../features/nonograms/nonograms-ui-slice'
import { NONOGRAM_PATH } from '../../features/nonograms/types'
/** Lives in the authenticated shell, so leaving the puzzle does not interrupt autosave. */
export function NonogramSync() {
  const game = useNonograms(),
    dispatch = useAppDispatch(),
    { draft, busy, uncertain, error, conflict } = game.ui
  const dirty = nonogramDirty(draft)
  useEffect(() => {
    if (!dirty || busy || uncertain || error || conflict || game.offline || !draft) return
    const timer = window.setTimeout(
      () =>
        void game.write({
          action: 'save',
          body: {
            id: draft.base.id,
            puzzleId: draft.base.puzzleId,
            version: draft.base.version,
            cells: draft.cells,
            assisted: draft.assisted,
            requestKey: crypto.randomUUID(),
          },
        }),
      700,
    )
    return () => window.clearTimeout(timer)
  }, [draft, busy, uncertain, error, conflict, game.offline, dirty])
  useEffect(() => {
    if (!draft || draft.ownerId !== game.ownerId || dirty || busy || uncertain || !game.data) return
    if (game.data.installationVersion > draft.base.version)
      dispatch(nonogramAccepted({ ownerId: game.ownerId!, game: game.game, reset: true }))
  }, [game.data, game.game, game.known, game.ownerId, draft, dirty, busy, uncertain, dispatch])
  useEffect(() => {
    if (!dirty && !busy && !uncertain) return
    const prevent = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', prevent)
    return () => window.removeEventListener('beforeunload', prevent)
  }, [dirty, busy, uncertain])
  return (dirty || uncertain) && (error || game.offline || conflict) ? (
    <p className="note" role="status">
      Nonograms has unsaved marks. <Link to={NONOGRAM_PATH}>Open your puzzle to retry</Link>.
    </p>
  ) : null
}
