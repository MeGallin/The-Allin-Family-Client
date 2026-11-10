import { useAppDispatch } from '../../app/store-hooks'
import { nonogramAccepted } from '../../features/nonograms/nonograms-ui-slice'
import { useRef, useState } from 'react'
import { Modal } from '../ui/Modal'
import { useNonograms } from '../../features/nonograms/useNonograms'
export default function NonogramInstall({
  onClose,
  onInstalled,
}: {
  onClose: () => void
  onInstalled: () => void
}) {
  const dispatch = useAppDispatch()
  const game = useNonograms(),
    [size, setSize] = useState<5 | 10>(5),
    key = useRef(crypto.randomUUID()),
    [version, setVersion] = useState(game.data?.installationVersion ?? 0)
  const [refreshing, setRefreshing] = useState(false)
  const choices = game.data?.catalogue.filter((p) => p.size === size) ?? []
  const puzzle = choices.find((p) => !p.played) ?? choices[0]
  async function install() {
    if (!puzzle) return
    if (
      await game.write({
        action: 'install',
        body: { version, nextPuzzleId: puzzle.puzzleId, requestKey: key.current },
      })
    )
      onInstalled()
  }
  return (
    <Modal
      title="Install Nonograms"
      onClose={() => {
        if (!game.ui.uncertain && !refreshing) onClose()
      }}
      busy={game.pending || refreshing}
    >
      <p>
        A personal picture puzzle, saved for your account in My widgets. Your board stays private.
      </p>
      <label htmlFor="nonogram-install-size">Starting size</label>
      <select
        id="nonogram-install-size"
        value={size}
        disabled={game.pending || refreshing || !!game.ui.uncertain}
        onChange={(e) => {
          setSize(Number(e.target.value) as 5 | 10)
          key.current = crypto.randomUUID()
        }}
      >
        <option value={5}>5×5</option>
        <option value={10}>10×10</option>
      </select>
      <p className="note">
        Six original puzzles: three of each size. Played puzzles can be replayed.
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
              if (ok) onInstalled()
            })
          }
        >
          Retry installation
        </button>
      )}
      {(game.ui.conflict || version !== game.data?.installationVersion) && (
        <button
          type="button"
          className="secondary"
          disabled={game.pending || refreshing || game.offline || !!game.ui.uncertain}
          onClick={async () => {
            setRefreshing(true)
            const data = await game.refresh()
            setRefreshing(false)
            if (data) {
              game.clearError()
              dispatch(nonogramAccepted({ ownerId: data.ownerId, game: data.game, reset: true }))
              setVersion(data.installationVersion)
              key.current = crypto.randomUUID()
              if (data.game) onInstalled()
            }
          }}
        >
          Refresh installation status
        </button>
      )}
      <div className="actions">
        <button
          type="button"
          disabled={
            !game.known || game.pending || refreshing || game.offline || !!game.ui.uncertain
          }
          onClick={() => void install()}
        >
          {game.pending ? 'Preparing puzzle…' : 'Install personal Nonograms'}
        </button>
        <button
          type="button"
          className="secondary"
          disabled={game.pending || refreshing || !!game.ui.uncertain}
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </Modal>
  )
}
