import { Grid2X2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useAppDispatch } from '../../app/store-hooks'
import { useNonograms } from '../../features/nonograms/useNonograms'
import {
  nonogramAccepted,
  nonogramDirty,
  nonogramEdited,
  nonogramHistory,
  nonogramOpened,
} from '../../features/nonograms/nonograms-ui-slice'
import { logicalSolution, correctPattern } from '../../features/nonograms/board'
import type { NonogramGame } from '../../features/nonograms/types'
import { ContentSurface } from '../ui/ContentSurface'
import { EmptyState } from '../ui/EmptyState'
import { LoadingState } from '../ui/LoadingState'
import { Modal } from '../ui/Modal'
import { RemovalConfirmation } from '../removals/RemovalConfirmation'
import { RemovalNotice } from '../removals/RemovalNotice'
import { NonogramArt } from './NonogramArt'
import './NonogramWorkspace.css'
export default function NonogramWorkspace({ onInstall }: { onInstall: () => void }) {
  const game = useNonograms(),
    dispatch = useAppDispatch()
  useEffect(() => {
    if (game.game && game.ownerId)
      dispatch(nonogramOpened({ ownerId: game.ownerId, game: game.game }))
  }, [game.game, game.ownerId, dispatch])
  const current = game.ui.draft?.base ?? game.game
  if (current && game.ui.draft)
    return <Board key={current.puzzleId} initial={current} game={game} />
  if (game.loading) return <LoadingState label="Opening your personal Nonograms…" />
  return (
    <ContentSurface>
      <EmptyState icon={Grid2X2} title="Your personal Nonograms">
        <p>Fill squares using the clues to reveal a little picture.</p>
        {game.error && (
          <p role="alert" className="error">
            {game.error}
          </p>
        )}
        <div className="actions">
          <button
            type="button"
            disabled={!game.known || game.pending || game.offline}
            onClick={onInstall}
          >
            Install personal Nonograms
          </button>
          <button
            type="button"
            className="secondary"
            disabled={game.pending || game.offline}
            onClick={game.refresh}
          >
            Refresh
          </button>
        </div>
      </EmptyState>
    </ContentSurface>
  )
}
type Controller = ReturnType<typeof useNonograms>
function Board({ initial, game }: { initial: NonogramGame; game: Controller }) {
  const dispatch = useAppDispatch(),
    draft = game.ui.draft!,
    base = draft.base,
    n = base.size
  const [mode, setMode] = useState<'1' | '2' | '0'>('1'),
    [cell, setCell] = useState(0),
    [size, setSize] = useState<5 | 10>(base.size),
    [enlarged, setEnlarged] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [confirmation, setConfirmation] = useState<'new' | 'restart' | 'latest' | 'remove' | null>(
      null,
    ),
    [message, setMessage] = useState('')
  const controls = useRef(new Map<number, HTMLButtonElement>()),
    command = useRef<{ signature: string; key: string } | null>(null)
  const solution = useMemo(() => logicalSolution(initial), [initial.puzzleId])
  const dirty = nonogramDirty(draft),
    removal = game.removals[base.id],
    stale = game.known && (!game.game || game.game.version !== base.version)
  const locked = game.pending || !!game.ui.uncertain || game.ui.conflict || stale || !!removal
  const complete = !!solution && correctPattern(draft.cells, solution)
  const choices = (game.data?.catalogue ?? []).filter((p) => p.size === size)
  const next =
    choices.find((p) => !p.played) ??
    choices.find((p) => p.puzzleId !== base.puzzleId) ??
    choices[0]
  function edit(index: number, value: '0' | '1' | '2', assisted = false) {
    if (locked) return
    const cells = [...draft.cells]
    cells[index] = cells[index] === value && !assisted ? '0' : value
    dispatch(nonogramEdited({ cells: cells.join(''), assisted }))
    setMessage('')
  }
  function keyboard(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let target = index
    if (event.key === 'ArrowLeft') target = Math.max(0, index - 1)
    else if (event.key === 'ArrowRight') target = Math.min(n * n - 1, index + 1)
    else if (event.key === 'ArrowUp') target = Math.max(0, index - n)
    else if (event.key === 'ArrowDown') target = Math.min(n * n - 1, index + n)
    else if (event.key === 'Home') target = Math.floor(index / n) * n
    else if (event.key === 'End') target = Math.floor(index / n) * n + n - 1
    else if (event.key === ' ') {
      event.preventDefault()
      edit(index, mode)
      return
    } else if (event.key.toLowerCase() === 'x') {
      event.preventDefault()
      edit(index, '2')
      return
    } else if (['Delete', 'Backspace'].includes(event.key)) {
      event.preventDefault()
      edit(index, '0')
      return
    } else return
    event.preventDefault()
    setCell(target)
    controls.current.get(target)?.focus()
  }
  function check() {
    if (!solution) return
    const mistakes = [...draft.cells].filter((v, i) =>
      v === '1' ? solution[i] !== '1' : v === '2' && solution[i] === '1',
    ).length
    setMessage(
      mistakes
        ? 'Some marked squares do not match the picture. Nothing has been changed.'
        : 'Your marked squares look right so far. Unknown squares are left for you.',
    )
  }
  function hint() {
    if (!solution || locked) return
    const index = [...draft.cells].findIndex((v, i) =>
      v === '1' ? solution[i] !== '1' : solution[i] === '1' || v !== '2',
    )
    if (index < 0) {
      setMessage('The picture is already complete.')
      return
    }
    edit(index, solution[index] === '1' ? '1' : '2', true)
    setCell(index)
    controls.current.get(index)?.focus()
    setMessage(
      `Hint: row ${Math.floor(index / n) + 1}, column ${(index % n) + 1} ${solution[index] === '1' ? 'is filled' : 'is empty'}.`,
    )
  }
  async function replace() {
    if (locked || game.offline || !['new', 'restart'].includes(confirmation ?? '')) return
    const action = confirmation === 'new' ? 'new' : 'restart'
    const body = {
      id: base.id,
      puzzleId: base.puzzleId,
      version: base.version,
      ...(action === 'new' ? { nextPuzzleId: next?.puzzleId } : {}),
    }
    const signature = JSON.stringify({ action, body })
    if (command.current?.signature !== signature)
      command.current = { signature, key: crypto.randomUUID() }
    if (await game.write({ action, body: { ...body, requestKey: command.current.key } })) {
      setConfirmation(null)
      setMessage('')
      setCell(0)
    }
  }
  async function latest() {
    if (game.pending || game.ui.uncertain || refreshing) return
    setRefreshing(true)
    const data = await game.refresh()
    setRefreshing(false)
    if (data && data.ownerId === game.ownerId) {
      dispatch(nonogramAccepted({ ownerId: data.ownerId, game: data.game, reset: true }))
      game.clearError()
      setConfirmation(null)
      setMessage('Latest saved board loaded.')
    } else setMessage('Could not load the latest board. Your local marks are kept; try again.')
  }
  const status = game.pending
    ? 'Saving…'
    : game.ui.uncertain
      ? 'Save uncertain · retry needed'
      : game.ui.conflict || stale
        ? 'Another window changed this puzzle'
        : game.ui.error
          ? 'Couldn’t save'
          : dirty
            ? game.offline
              ? 'Offline · marks kept here'
              : 'Waiting to save…'
            : 'Saved'
  return (
    <ContentSurface className="nonogram-workspace">
      <header className="nonogram-heading">
        <NonogramArt />
        <div>
          <h2>
            Picture puzzle · {n}×{n}
          </h2>
          <p>Fill the grid using its clues.</p>
        </div>
        <span role="status" className="note">
          {status}
        </span>
      </header>
      <p className="note">
        {base.replay ? 'Replay · ' : 'Original collection · '}
        {game.data?.played.length ?? 1} of 6 played. Your marks stay private.
      </p>
      {game.error && (
        <p className="error" role="alert">
          {game.error}
        </p>
      )}
      {game.ui.uncertain && (
        <button
          type="button"
          disabled={game.pending || game.offline}
          onClick={() =>
            void game.write(game.ui.uncertain!).then((ok) => {
              if (ok) setConfirmation(null)
            })
          }
        >
          Retry pending action
        </button>
      )}
      {dirty && game.ui.error && !game.ui.uncertain && !game.ui.conflict && !stale && (
        <button
          type="button"
          disabled={game.pending || game.offline}
          onClick={() =>
            void game.write({
              action: 'save',
              body: {
                id: base.id,
                puzzleId: base.puzzleId,
                version: base.version,
                cells: draft.cells,
                assisted: draft.assisted,
                requestKey: crypto.randomUUID(),
              },
            })
          }
        >
          Retry save
        </button>
      )}
      {(stale || game.ui.conflict) && !game.ui.uncertain && (
        <div className="actions">
          <p className="note">Your local marks are kept. Loading the latest board replaces them.</p>
          <button
            type="button"
            className="secondary"
            disabled={game.pending || game.offline}
            onClick={() => setConfirmation('latest')}
          >
            Load latest board
          </button>
        </div>
      )}
      <RemovalNotice removal={removal} />
      <div className="nonogram-modes" role="group" aria-label="Square mode">
        {(
          [
            ['1', 'Fill ■'],
            ['2', 'Mark empty ×'],
            ['0', 'Clear'],
          ] as const
        ).map(([value, label]) => (
          <button
            type="button"
            key={value}
            className="secondary"
            aria-pressed={mode === value}
            disabled={locked}
            onClick={() => setMode(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <div
        className="nonogram-board-scroll"
        role="region"
        aria-label={enlarged ? 'Enlarged puzzle, scroll to see all clues' : 'Picture puzzle board'}
        tabIndex={enlarged ? 0 : undefined}
      >
        <div
          className={'nonogram-board' + (enlarged ? ' nonogram-board--enlarged' : '')}
          style={{ '--nonogram-size': n } as React.CSSProperties}
          role="group"
          aria-label={`${n} by ${n} Nonograms. Arrow keys move; Space applies mode, X marks empty, Delete clears.`}
        >
          <span className="nonogram-corner" aria-hidden="true">
            {n}×{n}
          </span>
          {base.columnClues.map((clues, c) => (
            <span
              className={'nonogram-column' + (cell % n === c ? ' is-current' : '')}
              key={'c' + c}
              aria-label={`Column ${c + 1} clues ${clues.join(', ')}`}
            >
              {clues.map((value, i) => (
                <span key={i}>{value}</span>
              ))}
            </span>
          ))}
          {base.rowClues.map((clues, r) => (
            <div className="nonogram-row" key={r}>
              <span
                className={'nonogram-row-clue' + (Math.floor(cell / n) === r ? ' is-current' : '')}
                aria-label={`Row ${r + 1} clues ${clues.join(', ')}`}
              >
                {clues.join(' ')}
              </span>
              {Array.from({ length: n }, (_, c) => {
                const i = r * n + c,
                  v = draft.cells[i]
                return (
                  <button
                    type="button"
                    key={i}
                    ref={(node) => {
                      if (node) controls.current.set(i, node)
                      else controls.current.delete(i)
                    }}
                    className={
                      'nonogram-cell nonogram-cell--' +
                      v +
                      (c === 4 && n === 10 ? ' nonogram-cell--divider-right' : '') +
                      (r === 4 && n === 10 ? ' nonogram-cell--divider-bottom' : '')
                    }
                    tabIndex={cell === i ? 0 : -1}
                    aria-label={`Row ${r + 1}, column ${c + 1}: ${v === '1' ? 'filled' : v === '2' ? 'marked empty' : 'unknown'}. Row clues ${clues.join(', ')}. Column clues ${base.columnClues[c].join(', ')}.`}
                    aria-disabled={locked}
                    onFocus={() => setCell(i)}
                    onClick={() => {
                      setCell(i)
                      edit(i, mode)
                    }}
                    onKeyDown={(e) => keyboard(e, i)}
                  >
                    {v === '2' ? '×' : v === '1' ? <span className="sr-only">■</span> : ''}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="actions nonogram-tools">
        <button
          type="button"
          className="secondary"
          disabled={locked || !draft.past.length}
          onClick={() => dispatch(nonogramHistory('undo'))}
        >
          Undo
        </button>
        <button
          type="button"
          className="secondary"
          disabled={locked || !draft.future.length}
          onClick={() => dispatch(nonogramHistory('redo'))}
        >
          Redo
        </button>
        <button
          type="button"
          className="secondary"
          aria-pressed={enlarged}
          onClick={() => setEnlarged(!enlarged)}
        >
          {enlarged ? 'Fit board' : 'Enlarge board'}
        </button>
      </div>
      <p className="note">
        {enlarged
          ? 'Scroll the board sideways for larger squares and clues.'
          : '10×10 squares are compact on phones. Enlarge the board for larger squares.'}
      </p>
      {complete && (
        <div className="nonogram-complete" role="status">
          <strong>Picture complete · {base.name}</strong>
          <p>
            {dirty || game.pending
              ? 'Saving your finished picture…'
              : 'Your finished picture is saved.'}
            {draft.assisted ? ' You used a hint.' : ''}
          </p>
        </div>
      )}
      <p role="status">{message}</p>
      <div className="actions">
        <button type="button" className="secondary" disabled={locked || !solution} onClick={check}>
          Check progress
        </button>
        <button
          type="button"
          className="secondary"
          disabled={locked || !solution || complete}
          onClick={hint}
        >
          Hint
        </button>
      </div>
      <details className="nonogram-help">
        <summary>How to play</summary>
        <p>
          Reveal a hidden picture by working out which squares to fill and which to leave empty.
          Start with a 5×5 puzzle and take one row or column at a time. You do not need to guess.
        </p>
        <p>
          These five-square examples teach the rules; they are not the answer to your current
          puzzle. <strong>■ = filled, × = definitely empty, ? = not yet known.</strong> On your
          board, an unknown square is blank.
        </p>
        <ol className="nonogram-help__steps">
          <li>
            <strong>Read the clues beside each line.</strong>
            <p>
              Numbers on the left describe that row, reading left to right. Numbers above the grid
              describe that column, reading top to bottom. Each number means a block of that many
              filled squares touching each other, with no gaps inside it.
            </p>
            <div className="nonogram-help__example">
              <span className="nonogram-help__cells" aria-hidden="true">
                <span>■</span>
                <span>■</span>
                <span>■</span>
                <span>■</span>
                <span>■</span>
              </span>
              <span>Clue 5: fill all five squares.</span>
            </div>
          </li>
          <li>
            <strong>Keep blocks in order, with a gap between them.</strong>
            <p>
              A clue of “2 1” means a block of two, then a block of one, in that order. Leave at
              least one empty square between blocks. There can be more empty squares between them,
              or before the first block or after the last. The clues do not tell you those gap
              sizes.
            </p>
            <div className="nonogram-help__example">
              <span className="nonogram-help__cells" aria-hidden="true">
                <span>■</span>
                <span>■</span>
                <span>×</span>
                <span>■</span>
                <span>■</span>
              </span>
              <span>
                Clue 2 2: two filled, one empty, two filled. This is the only fit in five squares.
              </span>
            </div>
            <div className="nonogram-help__example">
              <span className="nonogram-help__cells" aria-hidden="true">
                <span>×</span>
                <span>■</span>
                <span>■</span>
                <span>×</span>
                <span>■</span>
              </span>
              <span>Clue 2 1: one possible fit is empty, two filled, empty, one filled.</span>
            </div>
            <div className="nonogram-help__example">
              <span className="nonogram-help__cells" aria-hidden="true">
                <span>×</span>
                <span>×</span>
                <span>×</span>
                <span>×</span>
                <span>×</span>
              </span>
              <span>Clue 0: all five squares are empty.</span>
            </div>
          </li>
          <li>
            <strong>Begin with squares you can prove.</strong>
            <p>
              Look for a line whose blocks and required gaps fill the whole line, like “5” or “2 2”
              above. You can place every square in those examples. With “0”, mark the whole line
              empty.
            </p>
            <p>
              If a block can move, look for an overlap. A clue of “3” in five squares can put its
              three filled squares in these three positions:
            </p>
            <div className="nonogram-help__example">
              <span className="nonogram-help__cells" aria-hidden="true">
                <span>■</span>
                <span>■</span>
                <span>■</span>
                <span>?</span>
                <span>?</span>
              </span>
              <span>Block starts at square 1.</span>
            </div>
            <div className="nonogram-help__example">
              <span className="nonogram-help__cells" aria-hidden="true">
                <span>?</span>
                <span>■</span>
                <span>■</span>
                <span>■</span>
                <span>?</span>
              </span>
              <span>Block starts at square 2.</span>
            </div>
            <div className="nonogram-help__example">
              <span className="nonogram-help__cells" aria-hidden="true">
                <span>?</span>
                <span>?</span>
                <span>■</span>
                <span>■</span>
                <span>■</span>
              </span>
              <span>Block starts at square 3.</span>
            </div>
            <p>
              Square 3, the middle square, is filled in every possible position. Fill only that
              square for now. The other four squares are still unknown: do not cross them out.
            </p>
            <div className="nonogram-help__example">
              <span className="nonogram-help__cells" aria-hidden="true">
                <span>?</span>
                <span>?</span>
                <span>■</span>
                <span>?</span>
                <span>?</span>
              </span>
              <span>Your safe first move: unknown, unknown, filled, unknown, unknown.</span>
            </div>
          </li>
          <li>
            <strong>Use each discovery in the crossing line.</strong>
            <p>
              A filled square belongs to both its row and its column. After working on a row, check
              the columns it crosses: your new marks may rule out possible block positions. Then
              check the rows again. Only fill a square if every remaining position fills it; only
              mark it empty if every remaining position leaves it empty.
            </p>
            <p>
              When you know exactly where a block starts and ends, mark the square just before and
              just after it empty, if those squares are inside the grid. This keeps it apart from
              other blocks. If you cannot prove a move, leave the square unknown and try another
              line.
            </p>
          </li>
          <li>
            <strong>Put your deductions on the board.</strong>
            <p>
              Choose <strong>Fill ■</strong>, then tap a square to fill it. Choose{' '}
              <strong>Mark empty ×</strong>, then tap a square you know is empty. Tapping the same
              mark again clears it back to unknown. Choose <strong>Clear</strong> to remove either
              kind of mark. You can also click squares with a mouse.
            </p>
            <p>
              Keep alternating between rows and columns until the picture is complete. Completion
              appears when all the correct squares, and no extra squares, are filled. You do not
              have to cross every empty square; crosses are notes to help you reason.
            </p>
          </li>
        </ol>
        <p>
          <strong>Helpful controls and saving</strong>
        </p>
        <ul>
          <li>
            <strong>Undo</strong> reverses a board edit; <strong>Redo</strong> restores an undone
            edit.
          </li>
          <li>
            <strong>Check progress</strong> tells you whether your current marks contain mistakes.
            It does not change any squares or fill in unknown ones. <strong>Hint</strong> reveals or
            corrects one square. Using it records that you had help, even if you Undo the hint.
          </li>
          <li>
            <strong>Keyboard:</strong> Tab into the board, then use arrow keys to move. Home and End
            go to the first and last square of the row. Space applies your selected mode; X toggles
            an empty mark; Delete or Backspace clears the square.
          </li>
          <li>
            <strong>Enlarge board</strong> gives you larger squares and clues; scroll sideways
            within the board when needed. <strong>Fit board</strong> returns to the compact view.
          </li>
          <li>
            Your marks save automatically. Wait for <strong>Saved</strong> before refreshing or
            closing the page. If saving fails or needs a retry, follow the message on the board;
            unsaved marks may be lost if you refresh or close anyway.
          </li>
          <li>
            <strong>Next puzzle size</strong> chooses the size for your next board. Confirming{' '}
            <strong>New puzzle</strong> replaces the current board; confirming{' '}
            <strong>Reset puzzle</strong> clears this same puzzle to start again without hints
            recorded. Both replace your current marks. There are six pictures, three of each size.
            Once you have played all pictures of a size, New puzzle offers a labelled replay.
          </li>
        </ul>
      </details>
      <div className="nonogram-next">
        <label htmlFor="nonogram-next-size">Next puzzle size</label>
        <select
          id="nonogram-next-size"
          value={size}
          disabled={locked}
          onChange={(e) => setSize(Number(e.target.value) as 5 | 10)}
        >
          <option value={5}>5×5</option>
          <option value={10}>10×10</option>
        </select>
        <span className="note">
          {next?.played
            ? 'All puzzles of this size have been played. The next puzzle is a replay.'
            : 'An unplayed puzzle is available.'}
        </span>
      </div>
      <div className="actions">
        <button
          type="button"
          disabled={locked || game.offline || !next}
          onClick={() => setConfirmation('new')}
        >
          New puzzle
        </button>
        <button
          type="button"
          className="secondary"
          disabled={locked || game.offline}
          onClick={() => setConfirmation('restart')}
        >
          Reset puzzle
        </button>
        <button
          type="button"
          className="secondary"
          disabled={locked || dirty || game.offline}
          onClick={() => setConfirmation('remove')}
        >
          Remove installation
        </button>
      </div>
      {confirmation === 'remove' && (
        <RemovalConfirmation
          item={base}
          noun="Nonograms installation"
          history="Its current board will be removed. Played puzzle labels are kept for your account; reinstalling starts a fresh board."
          busy={locked || dirty}
          error={game.error}
          schedule={game.remove}
          onClose={() => setConfirmation(null)}
        />
      )}
      {confirmation && confirmation !== 'remove' && (
        <Modal
          title={
            confirmation === 'latest'
              ? 'Load latest board?'
              : confirmation === 'restart'
                ? 'Reset this puzzle?'
                : 'Start another puzzle?'
          }
          busy={game.pending || refreshing || !!game.ui.uncertain}
          onClose={() => {
            if (!game.ui.uncertain && !refreshing) setConfirmation(null)
          }}
        >
          <p>
            {confirmation === 'latest'
              ? 'Replace your local marks with the latest saved board?'
              : confirmation === 'restart'
                ? 'Clear all marks on this puzzle?'
                : 'Replace this board with a ' +
                  size +
                  '×' +
                  size +
                  ' puzzle' +
                  (next?.played ? ' (replay)' : '') +
                  '?'}
          </p>
          <p>Your current marks will be replaced.</p>
          {game.ui.uncertain && (
            <button
              type="button"
              disabled={game.pending || game.offline}
              onClick={() =>
                void game.write(game.ui.uncertain!).then((ok) => {
                  if (ok) setConfirmation(null)
                })
              }
            >
              Retry pending action
            </button>
          )}
          {message && <p role="status">{message}</p>}
          {game.error && (
            <p role="alert" className="error">
              {game.error}
            </p>
          )}
          <div className="actions">
            <button
              type="button"
              disabled={game.pending || refreshing || game.offline || !!game.ui.uncertain}
              onClick={() => void (confirmation === 'latest' ? latest() : replace())}
            >
              {confirmation === 'latest'
                ? 'Load latest'
                : confirmation === 'restart'
                  ? 'Reset puzzle'
                  : 'Start puzzle'}
            </button>
            <button
              type="button"
              className="secondary"
              disabled={game.pending || refreshing || !!game.ui.uncertain}
              onClick={() => setConfirmation(null)}
            >
              Keep playing
            </button>
          </div>
        </Modal>
      )}
    </ContentSurface>
  )
}
