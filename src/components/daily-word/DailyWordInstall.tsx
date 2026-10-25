import { useRef, useState } from 'react'
import { Modal } from '../ui/Modal'
import { useDailyWord } from '../../features/daily-word/useDailyWord'
import './DailyWord.css'
export default function DailyWordInstall({
  onClose,
  onInstalled,
}: {
  onClose: () => void
  onInstalled: () => void
}) {
  const word = useDailyWord(),
    key = useRef(crypto.randomUUID())
  const [version, setVersion] = useState(word.data?.installationVersion ?? 0)
  return (
    <Modal
      title="Install Daily Word"
      className="daily-word-install"
      busy={word.pending}
      onClose={onClose}
    >
      <p>
        One five-letter word for the family each London day. You have six valid guesses. Your
        guesses and progress stay private.
      </p>
      <p className="note">
        Finished results are shared only when you choose. Removing and reinstalling keeps today’s
        attempts.
      </p>
      {word.error && (
        <p role="alert" className="error">
          {word.error}
        </p>
      )}
      {version !== word.data?.installationVersion && (
        <button
          type="button"
          className="secondary"
          disabled={word.pending}
          onClick={() => {
            setVersion(word.data?.installationVersion ?? 0)
            key.current = crypto.randomUUID()
            word.clearError()
          }}
        >
          Load latest installation status
        </button>
      )}
      <div className="actions">
        <button
          type="button"
          disabled={!word.known || word.pending || word.offline}
          onClick={async () => {
            const result = await word.write('install', { version, requestKey: key.current })
            if (result?.receipt?.installed) onInstalled()
          }}
        >
          {word.pending ? 'Installing…' : 'Install personal Daily Word'}
        </button>
        <button type="button" className="secondary" onClick={onClose} disabled={word.pending}>
          Cancel
        </button>
      </div>
    </Modal>
  )
}
