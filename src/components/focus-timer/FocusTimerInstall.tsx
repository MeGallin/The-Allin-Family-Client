import { useRef, useState } from 'react'
import { Modal } from '../ui/Modal'
import { useFocusTimer } from '../../features/focus-timer/useFocusTimer'
import './FocusTimer.css'
export default function FocusTimerInstall({
  onClose,
  onInstalled,
}: {
  onClose: () => void
  onInstalled: () => void
}) {
  const timer = useFocusTimer(),
    key = useRef(crypto.randomUUID())
  const [base, setBase] = useState({
    version: timer.data?.version ?? 0,
    generation: timer.data?.generation ?? 0,
  })
  return (
    <Modal
      title="Install Focus Timer"
      className="focus-timer-install"
      busy={timer.pending}
      onClose={onClose}
    >
      <p>
        One personal focus and break timer for your account. Your session labels and history stay
        private across your devices.
      </p>
      <p className="note">
        Choose Focus, Short break or Long break. Nothing starts automatically. The timer measures
        elapsed time, not attention, and stays quiet.
      </p>
      {timer.error && (
        <p role="alert" className="error">
          {timer.error}
        </p>
      )}
      {timer.data && base.version !== timer.data.version && (
        <button
          type="button"
          className="secondary"
          disabled={timer.pending}
          onClick={() => {
            setBase({ version: timer.data!.version, generation: timer.data!.generation })
            key.current = crypto.randomUUID()
            timer.clearError()
          }}
        >
          Load latest installation status
        </button>
      )}
      <div className="actions">
        <button
          type="button"
          disabled={!timer.known || timer.pending || timer.offline}
          onClick={async () => {
            const result = await timer.write('install', { ...base, requestKey: key.current })
            if (result?.receipt?.installed) onInstalled()
          }}
        >
          {timer.pending ? 'Installing…' : 'Install personal Focus Timer'}
        </button>
        <button type="button" className="secondary" disabled={timer.pending} onClick={onClose}>
          Cancel
        </button>
      </div>
    </Modal>
  )
}
