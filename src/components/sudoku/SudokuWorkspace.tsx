import { useEffect, useState } from 'react'
import { Grid2X2 } from 'lucide-react'
import { useSudoku } from '../../features/sudoku/useSudoku'
import type { SudokuGame } from '../../features/sudoku/types'
import { SudokuBoard } from './SudokuBoard'
import { ContentSurface } from '../ui/ContentSurface'
import { EmptyState } from '../ui/EmptyState'
import { LoadingState } from '../ui/LoadingState'
export default function SudokuWorkspace({
  onInstall,
  onExit,
}: {
  onInstall: () => void
  onExit: () => void
}) {
  const sudoku = useSudoku(),
    [retained, setRetained] = useState<SudokuGame | null>(sudoku.game)
  useEffect(() => {
    if (sudoku.game) setRetained(sudoku.game)
  }, [sudoku.game])
  const current = sudoku.game ?? retained
  if (current)
    return <SudokuBoard key={current.id} initial={current} sudoku={sudoku} onExit={onExit} />
  if (sudoku.loading) return <LoadingState label="Opening your personal Sudoku…" />
  return (
    <ContentSurface>
      <EmptyState icon={Grid2X2} title="Your personal Sudoku">
        <p>One game for your account, saved in My widgets. Your progress stays private to you.</p>
        {sudoku.error && (
          <p role="alert" className="error">
            {sudoku.error}
          </p>
        )}
        <div className="actions">
          <button
            type="button"
            onClick={onInstall}
            disabled={!sudoku.known || sudoku.offline || sudoku.pending}
          >
            Install personal Sudoku
          </button>
          <button
            type="button"
            className="secondary"
            onClick={sudoku.refresh}
            disabled={sudoku.pending || sudoku.offline}
          >
            Refresh
          </button>
        </div>
      </EmptyState>
    </ContentSurface>
  )
}
