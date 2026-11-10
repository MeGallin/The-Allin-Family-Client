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
        Bold numbers are fixed clues. Select a square, then choose a number. Keyboard controls are
        in How to play.
      </p>
      <details className="sudoku-help">
        <summary>How to play</summary>
        <p>
          Sudoku is a logic puzzle, with no arithmetic. Start with Easy and work out one certain
          number at a time. The digits are symbols to place, not numbers to add up.
        </p>
        <ol className="sudoku-help__steps">
          <li>
            <strong>Learn the three rules.</strong>
            <p>
              Fill the 9×9 grid with digits 1–9. Every horizontal row, every vertical column and
              every 3×3 box must contain each digit exactly once, with no repeats. The thicker
              borders separate the nine boxes. Every square belongs to one row, one column and one
              box, so its number must fit all three.
            </p>
          </li>
          <li>
            <strong>Start from the fixed clues.</strong>
            <p>
              The bold numbers were supplied with the puzzle and cannot be changed. Look for a row,
              column or box with lots of numbers already filled in. List which digits from 1–9 are
              missing; those are the only digits its empty squares could contain.
            </p>
          </li>
          <li>
            <strong>Check the crossing row, column and box.</strong>
            <p>
              Pick an empty square. Rule out every digit already used in its row, its column or its
              box. The digits left are its candidates: possible answers, not yet proven ones. If
              only one candidate remains, you can enter it as a full-size number.
            </p>
            <p className="sudoku-help__example">
              <strong>Worked example:</strong> imagine a row reads “1 2 3 · 5 6 7 8 9”, where the
              dot is its only empty square. The missing digit is 4. Check that the square’s column
              and 3×3 box also allow 4, then enter it. If either already contains 4, an earlier
              entry needs checking. This example is illustrative, not your current puzzle’s answer.
            </p>
          </li>
          <li>
            <strong>Use pencil marks when several digits could fit.</strong>
            <p>
              Select an empty square, turn <strong>Pencil</strong> on, then choose each candidate
              using the number buttons or keyboard. Small numbers are reminders, not answers. Choose
              a digit again to remove that note. Update your notes yourself as you place numbers
              nearby; the game does not automatically remove ruled-out notes.
            </p>
            <p>
              When you know the answer, turn Pencil off and enter the digit. This replaces the
              square’s notes with a full-size number. Using pencil input on a square you already
              filled replaces that entry with notes, so use it on empty squares while working out
              possibilities.
            </p>
          </li>
          <li>
            <strong>Look for the only place a digit can go.</strong>
            <p>
              Choose a missing digit in one row, column or box. Check each empty square against its
              crossing groups. If all but one square are ruled out, that last square must contain
              the digit, even if you had written several candidates there. For example, if a box
              needs a 7 and every empty square except one has a 7 in its row or column, put 7 in the
              remaining square.
            </p>
            <p>
              After each placement, check its row, column and box again: it may leave just one
              candidate elsewhere. Alternate between these two deductions. If you cannot prove a
              move, try another area and revisit your notes rather than guessing.
            </p>
          </li>
          <li>
            <strong>Enter your deductions and review conflicts.</strong>
            <p>
              With Pencil off, tap or click an empty square, then choose a number below the grid or
              type 1–9. You can select one of your entries to replace it, or use{' '}
              <strong>Clear</strong> to remove it and its notes. The bold clues stay fixed.
            </p>
            <p>
              Conflict highlights mean a digit is repeated in a row, column or box. Both repeated
              cells are highlighted; this does not identify which entry to change. No highlight only
              means there is no repeated digit so far, not that every entry is correct. Check your
              reasoning and use Clear or Undo if needed.
            </p>
            <p>
              Finish by filling every square so all three rules hold. The game recognises a full
              board with no conflicts; use <strong>Save progress</strong> to record your finish.
            </p>
          </li>
        </ol>
        <h3>Controls and saving</h3>
        <ul>
          <li>
            <strong>Keyboard:</strong> while the grid has focus, arrow keys move one square;
            Home/End go to the first/last square in the row; Ctrl/Cmd+Home/End go to the first/last
            square of the board. Type 1–9 to enter digits, P to toggle Pencil, and Delete, Backspace
            or 0 to clear the selected editable square.
          </li>
          <li>
            <strong>Undo and Redo:</strong> use the buttons, Ctrl/Cmd+Z to undo, or Ctrl/Cmd+Shift+Z
            / Ctrl/Cmd+Y to redo while in the grid. History holds up to 100 local changes and resets
            on refresh; it is not saved with the puzzle.
          </li>
          <li>
            <strong>Save progress:</strong> saving is manual, not automatic. Save your entries,
            pencil marks and paused state before leaving or refreshing. Ctrl/Cmd+S saves while the
            grid has focus. Wait for the saved status; an incomplete board or one with conflicts can
            still be saved. If offline, keep the page open and reconnect before saving. Your
            progress is private to your account.
          </li>
          <li>
            <strong>Pause / Resume:</strong> hide and reveal the board. There is no timer or score.
          </li>
          <li>
            <strong>New puzzle / Restart puzzle:</strong> New puzzle lets you choose a level and
            replaces the current puzzle and its progress after confirmation. Restart clears your
            entries and notes but keeps the same clues, also after confirmation. Easy has 42
            starting clues, Medium 36 and Hard 30; these describe clue counts rather than a
            guaranteed solving difficulty.
          </li>
          <li>
            <strong>Refresh saved game:</strong> checks for the latest saved version. If another
            window has changed the game, your local edits are kept until you choose and confirm
            loading the latest version, which discards those edits and Undo history.
          </li>
        </ul>
      </details>
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
          <p className="sudoku-board__selected-notes" role="status">
            Row {Math.floor(cell / 9) + 1}, column {(cell % 9) + 1} ·{' '}
            {progress.entries[cell] !== '0'
              ? `Number ${progress.entries[cell]}`
              : `Pencil marks: ${
                  Array.from({ length: 9 }, (_, i) => i + 1)
                    .filter((digit) => progress.notes[cell] & (1 << (digit - 1)))
                    .join(', ') || 'none'
                }`}
          </p>
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
