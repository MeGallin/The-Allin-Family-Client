import { useState, useRef } from 'react'
import { Modal } from '../ui/Modal'
import { useSudoku } from '../../features/sudoku/useSudoku'
import { sudokuLevels, type SudokuDifficulty } from '../../features/sudoku/types'
export function SudokuInstall({
  onClose,
  onInstalled,
}: {
  onClose: () => void
  onInstalled: () => void
}) {
  const sudoku = useSudoku(),
    [difficulty, setDifficulty] = useState<SudokuDifficulty>('easy')
  const [baseVersion, setBaseVersion] = useState(sudoku.installationVersion)
  const request = useRef<{ difficulty: SudokuDifficulty; key: string } | null>(null)
  async function install() {
    if (sudoku.pending || sudoku.offline || !sudoku.known) return
    if (!request.current || request.current.difficulty !== difficulty)
      request.current = { difficulty, key: crypto.randomUUID() }
    sudoku.clearError()
    const result = await sudoku.install(difficulty, request.current.key, baseVersion)
    if (result?.game) onInstalled()
  }
  return (
    <Modal title="Install Sudoku" onClose={onClose} busy={sudoku.pending}>
      <p>
        One personal Sudoku installation, saved for your account in My widgets. It is not shared
        with Family widgets.
      </p>
      <label htmlFor="sudoku-install-level">Starting level</label>
      <select
        id="sudoku-install-level"
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
      <p className="note">
        Choose how many starting numbers you’d like. Every puzzle has exactly one solution.
      </p>
      {sudoku.error && (
        <p role="alert" className="error">
          {sudoku.error}
        </p>
      )}
      {baseVersion !== sudoku.installationVersion && (
        <button
          type="button"
          className="secondary"
          disabled={sudoku.pending}
          onClick={() => {
            setBaseVersion(sudoku.installationVersion)
            request.current = null
            sudoku.clearError()
          }}
        >
          Load latest installation status
        </button>
      )}
      <div className="actions">
        <button
          type="button"
          onClick={() => void install()}
          disabled={sudoku.pending || sudoku.offline || !sudoku.known}
        >
          {sudoku.pending ? 'Preparing your puzzle…' : 'Install personal Sudoku'}
        </button>
        <button type="button" className="secondary" onClick={onClose} disabled={sudoku.pending}>
          Cancel
        </button>
      </div>
    </Modal>
  )
}
