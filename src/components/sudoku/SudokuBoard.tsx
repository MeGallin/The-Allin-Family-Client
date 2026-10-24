import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { Pencil, Pause, Play, Undo2, Redo2, Eraser, Save, RefreshCw, Trash2 } from 'lucide-react'
import { useSudoku } from '../../features/sudoku/useSudoku'
import {
  conflicts,
  enterDigit,
  moveCell,
  peers,
  progressOf,
  sameProgress,
} from '../../features/sudoku/sudoku-board'
import {
  sudokuLevels,
  type SudokuDifficulty,
  type SudokuGame,
  type SudokuProgress,
} from '../../features/sudoku/types'
import { useDraftGuard } from '../../features/drafts/DraftProtection'
import { Icon } from '../ui/Icon'
import { Modal } from '../ui/Modal'
import { RemovalConfirmation } from '../removals/RemovalConfirmation'
import { RemovalNotice } from '../removals/RemovalNotice'
import './SudokuBoard.css'
type Controller = ReturnType<typeof useSudoku>
export function SudokuBoard({
  initial,
  sudoku,
  onExit,
}: {
  initial: SudokuGame
  sudoku: Controller
  onExit: () => void
}) {
  const [baseline, setBaseline] = useState(initial),
    [progress, setProgress] = useState(() => progressOf(initial))
  const [past, setPast] = useState<SudokuProgress[]>([]),
    [future, setFuture] = useState<SudokuProgress[]>([])
  const [cell, setCell] = useState(0),
    [pencil, setPencil] = useState(false),
    [difficulty, setDifficulty] = useState<SudokuDifficulty>(initial.difficulty)
  const [confirmation, setConfirmation] = useState<'new' | 'restart' | 'reload' | 'remove' | null>(
    null,
  )
  const controls = useRef(new Map<number, HTMLButtonElement>()),
    request = useRef<{ signature: string; key: string } | null>(null),
    scheduled = useRef(false)
  const dirty = !sameProgress(progress, progressOf(baseline)),
    guard = useDraftGuard(dirty, sudoku.pending),
    help = useId()
  const latest = sudoku.game,
    stale = sudoku.known && (!latest || latest.version !== baseline.version)
  const removal = sudoku.removals[baseline.id],
    bad = conflicts(progress.entries),
    complete = !progress.entries.includes('0') && bad.size === 0,
    recordedComplete = !!baseline.completedAt && progress.entries === baseline.entries
  const locked = sudoku.pending || !!removal
  function accept(game: SudokuGame, reset = true) {
    setBaseline(game)
    setProgress(progressOf(game))
    setDifficulty(game.difficulty)
    if (reset) {
      setPast([])
      setFuture([])
    }
    request.current = null
  }
  useEffect(() => {
    if (!dirty && !sudoku.pending && latest && latest.version !== baseline.version) accept(latest)
  }, [latest, dirty, sudoku.pending, baseline.version])
  function change(next: SudokuProgress) {
    if (locked || sameProgress(next, progress)) return
    setPast((history) => [...history, progress].slice(-100))
    setFuture([])
    setProgress(next)
  }
  function undo() {
    if (locked || !past.length) return
    setFuture((history) => [progress, ...history].slice(0, 100))
    setProgress(past[past.length - 1])
    setPast(past.slice(0, -1))
  }
  function redo() {
    if (locked || !future.length) return
    setPast((history) => [...history, progress].slice(-100))
    setProgress(future[0])
    setFuture(future.slice(1))
  }
  function key(signature: string) {
    if (request.current?.signature !== signature)
      request.current = { signature, key: crypto.randomUUID() }
    return request.current.key
  }
  async function save() {
    if (locked || stale || sudoku.offline || !dirty) return
    sudoku.clearError()
    const signature = JSON.stringify({
      action: 'save',
      id: baseline.id,
      version: baseline.version,
      ...progress,
    })
    const result = await sudoku.save(baseline, progress, key(signature))
    if (result?.game) guard.complete(() => accept(result.game!, false))
  }
  async function replace() {
    if (locked || stale || sudoku.offline) return
    sudoku.clearError()
    const signature = JSON.stringify({
      action: confirmation,
      id: baseline.id,
      version: baseline.version,
      difficulty: confirmation === 'new' ? difficulty : null,
    })
    const result =
      confirmation === 'new'
        ? await sudoku.newGame(baseline, difficulty, key(signature))
        : await sudoku.restart(baseline, key(signature))
    if (result?.game)
      guard.complete(() => {
        accept(result.game!)
        setConfirmation(null)
      })
  }
  function keyboard(event: KeyboardEvent) {
    if (locked) return
    const next = moveCell(cell, event.key, event.ctrlKey || event.metaKey)
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
      event.preventDefault()
      setCell(next)
      controls.current.get(next)?.focus()
      return
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault()
      if (event.shiftKey) redo()
      else undo()
      return
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
      event.preventDefault()
      redo()
      return
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault()
      void save()
      return
    }
    if (event.ctrlKey || event.metaKey || event.altKey) return
    if (/^[1-9]$/.test(event.key)) {
      event.preventDefault()
      change(enterDigit(progress, baseline.givens, cell, Number(event.key), pencil))
    } else if (['Backspace', 'Delete', '0'].includes(event.key)) {
      event.preventDefault()
      change(enterDigit(progress, baseline.givens, cell, 0, false))
    } else if (event.key.toLowerCase() === 'p') {
      event.preventDefault()
      setPencil((value) => !value)
    }
  }
  return (
    <section className="sudoku-board" aria-label="Your personal Sudoku">
      <header className="sudoku-board__heading">
        <div>
          <h2>Sudoku</h2>
          <p>
            {baseline.difficulty[0].toUpperCase() + baseline.difficulty.slice(1)} ·{' '}
            {baseline.givens.replace(/0/g, '').length} clues · Personal
          </p>
        </div>
        <button
          type="button"
          onClick={() => void save()}
          disabled={!dirty || locked || stale || sudoku.offline}
        >
          <Icon icon={Save} />
          {sudoku.pending ? 'Saving…' : 'Save progress'}
        </button>
      </header>
      <p className="sudoku-board__status" role="status">
        {dirty
          ? 'Unsaved changes — use Save progress.'
          : `Saved${baseline.completedAt ? ' · Puzzle completed' : ''}.`}
        {!dirty && !baseline.completedAt && sudoku.feedback ? ' ' + sudoku.feedback : ''}
      </p>
      <RemovalNotice removal={removal} />
      {sudoku.error && (
        <p className="error" role="alert">
          {sudoku.error}
          {sudoku.failure?.status === 0
            ? ' The save outcome may be uncertain. Your local board is kept; retry the same save or review the latest game.'
            : ''}
        </p>
      )}
      {stale && (
        <div className="sudoku-board__conflict" role="alert">
          <p>
            {latest
              ? 'This game changed in another window. Your local board is kept.'
              : 'This installation is no longer available. Your local board is kept.'}
          </p>
          <button
            type="button"
            className="secondary"
            onClick={() => setConfirmation('reload')}
            disabled={locked}
          >
            Load latest · discard local changes
          </button>
        </div>
      )}
      <p id={help} className="note">
        Bold numbers are fixed clues. Arrow keys move; Home/End move within a row, Ctrl+Home/End
        across the board. Type 1–9; Delete clears; P toggles pencil marks. Undo/Redo lasts until
        refresh.
      </p>
      <div className="sudoku-board__toolbar" role="group" aria-label="Game controls">
        <button
          type="button"
          className="secondary"
          aria-pressed={pencil}
          onClick={() => setPencil((value) => !value)}
          disabled={locked || progress.paused}
        >
          <Icon icon={Pencil} />
          Pencil
        </button>
        <button
          type="button"
          className="secondary"
          onClick={undo}
          disabled={locked || !past.length}
        >
          <Icon icon={Undo2} />
          Undo
        </button>
        <button
          type="button"
          className="secondary"
          onClick={redo}
          disabled={locked || !future.length}
        >
          <Icon icon={Redo2} />
          Redo
        </button>
        <button
          type="button"
          className="secondary"
          onClick={() => change({ ...progress, paused: !progress.paused })}
          disabled={locked}
        >
          <Icon icon={progress.paused ? Play : Pause} />
          {progress.paused ? 'Resume' : 'Pause'}
        </button>
      </div>
      {progress.paused ? (
        <div className="sudoku-board__paused" role="status">
          <Icon icon={Pause} />
          <h3>Board paused</h3>
          <p>Your board is hidden. Resume whenever you’re ready.</p>
          <button
            type="button"
            className="secondary"
            onClick={() => change({ ...progress, paused: false })}
            disabled={locked}
          >
            Resume game
          </button>
        </div>
      ) : (
        <>
          <div
            className="sudoku-grid"
            role="grid"
            aria-label="Sudoku, 9 rows and 9 columns"
            aria-describedby={help}
            onKeyDown={keyboard}
          >
            {Array.from({ length: 9 }, (_, row) => (
              <div className="sudoku-row" role="row" key={row}>
                {Array.from({ length: 9 }, (_, column) => {
                  const index = row * 9 + column,
                    given = baseline.givens[index] !== '0',
                    value = progress.entries[index],
                    notes = Array.from({ length: 9 }, (_, i) => i + 1).filter(
                      (digit) => progress.notes[index] & (1 << (digit - 1)),
                    )
                  return (
                    <div
                      role="gridcell"
                      aria-selected={index === cell}
                      aria-readonly={given}
                      aria-invalid={bad.has(index) || undefined}
                      className="sudoku-position"
                      key={index}
                    >
                      <button
                        type="button"
                        className={
                          'sudoku-cell' +
                          (given ? ' is-given' : '') +
                          (index === cell ? ' is-selected' : peers(index, cell) ? ' is-peer' : '') +
                          (value !== '0' && value === progress.entries[cell] ? ' is-match' : '') +
                          (bad.has(index) ? ' is-conflict' : '')
                        }
                        tabIndex={index === cell ? 0 : -1}
                        aria-disabled={locked}
                        ref={(node) => {
                          if (node) controls.current.set(index, node)
                          else controls.current.delete(index)
                        }}
                        onFocus={() => setCell(index)}
                        onClick={() => {
                          if (!locked) setCell(index)
                        }}
                        aria-label={`Row ${row + 1}, column ${column + 1}, ${given ? 'clue ' : ''}${value !== '0' ? value : notes.length ? 'pencil ' + notes.join(', ') : 'empty'}${bad.has(index) ? ', conflict' : ''}`}
                      >
                        {value !== '0' ? (
                          value
                        ) : (
                          <span className="sudoku-notes" aria-hidden="true">
                            {Array.from({ length: 9 }, (_, i) => (
                              <span key={i}>{progress.notes[index] & (1 << i) ? i + 1 : ''}</span>
                            ))}
                          </span>
                        )}
                      </button>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
          <p className="note" role="status">
            {bad.size
              ? `${bad.size} cells have a row, column or box conflict.`
              : complete
                ? recordedComplete
                  ? 'Your finish is saved.'
                  : 'Puzzle complete — save to record your finish.'
                : pencil
                  ? 'Pencil mode: numbers toggle small notes.'
                  : 'Number mode: numbers fill the selected cell.'}
          </p>
          <div
            className="sudoku-keypad"
            role="group"
            aria-label={pencil ? 'Enter pencil marks' : 'Enter a number'}
          >
            {Array.from({ length: 9 }, (_, i) => (
              <button
                type="button"
                className="secondary"
                key={i}
                disabled={locked || baseline.givens[cell] !== '0'}
                onClick={() => change(enterDigit(progress, baseline.givens, cell, i + 1, pencil))}
              >
                {i + 1}
              </button>
            ))}
            <button
              type="button"
              className="secondary"
              disabled={locked || baseline.givens[cell] !== '0'}
              onClick={() => change(enterDigit(progress, baseline.givens, cell, 0, false))}
            >
              <Icon icon={Eraser} />
              Clear
            </button>
          </div>
        </>
      )}
      <div className="sudoku-board__footer">
        <p className="note">
          One installation per account. Easy starts with 42 numbers, Medium 36 and Hard 30. Your
          progress stays private to you.
        </p>
        <div className="actions">
          <button
            type="button"
            className="secondary"
            onClick={() => setConfirmation('new')}
            disabled={locked || stale || sudoku.offline}
          >
            New puzzle
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => setConfirmation('restart')}
            disabled={locked || stale || sudoku.offline}
          >
            Restart puzzle
          </button>
          <button
            type="button"
            className="secondary"
            onClick={sudoku.refresh}
            disabled={locked || sudoku.offline}
          >
            <Icon icon={RefreshCw} />
            Refresh saved game
          </button>
          <button
            type="button"
            className="text-button"
            onClick={() => {
              scheduled.current = false
              setConfirmation('remove')
            }}
            disabled={locked || stale || sudoku.offline}
          >
            <Icon icon={Trash2} />
            Remove Sudoku
          </button>
        </div>
      </div>
      {confirmation && confirmation !== 'remove' && (
        <Modal
          title={
            confirmation === 'new'
              ? 'Start a new puzzle?'
              : confirmation === 'restart'
                ? 'Restart this puzzle?'
                : 'Load the latest saved game?'
          }
          busy={sudoku.pending}
          onClose={() => setConfirmation(null)}
        >
          <p>
            {confirmation === 'new'
              ? 'This replaces your current puzzle and its progress.'
              : confirmation === 'restart'
                ? 'This clears your entries and pencil marks, keeping the same clues.'
                : 'Your local entries, pencil marks and Undo history will be discarded.'}{' '}
            Unsaved changes will be lost only after you confirm.
          </p>
          {confirmation === 'new' && (
            <>
              <label htmlFor={help + '-level'}>Level</label>
              <select
                id={help + '-level'}
                value={difficulty}
                onChange={(event) => setDifficulty(event.target.value as SudokuDifficulty)}
                disabled={sudoku.pending}
              >
                {sudokuLevels.map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.label} · {level.clues} clues
                  </option>
                ))}
              </select>
            </>
          )}
          {sudoku.error && (
            <p className="error" role="alert">
              {sudoku.error}
            </p>
          )}
          <div className="actions">
            <button
              type="button"
              className="secondary"
              onClick={() => setConfirmation(null)}
              disabled={sudoku.pending}
              data-modal-autofocus
            >
              Keep current game
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirmation === 'reload')
                  guard.complete(() => {
                    if (latest) accept(latest)
                    else onExit()
                    setConfirmation(null)
                  })
                else void replace()
              }}
              disabled={sudoku.pending || (confirmation !== 'reload' && (stale || sudoku.offline))}
            >
              {confirmation === 'reload'
                ? 'Discard local and load latest'
                : sudoku.pending
                  ? 'Preparing puzzle…'
                  : confirmation === 'new'
                    ? 'Start new puzzle'
                    : 'Restart puzzle'}
            </button>
          </div>
        </Modal>
      )}
      {confirmation === 'remove' && (
        <RemovalConfirmation
          item={latest ?? baseline}
          noun="Sudoku installation"
          history="The saved game is soft-removed. Reinstalling later starts a new game. Unsaved local changes will be discarded."
          busy={locked}
          error={sudoku.error}
          schedule={(record) => {
            const saved = sudoku.remove(record)
            scheduled.current = saved
            return saved
          }}
          onClose={() => {
            setConfirmation(null)
            if (scheduled.current) guard.complete(onExit)
          }}
        />
      )}
    </section>
  )
}
