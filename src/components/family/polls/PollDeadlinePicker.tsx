import { useId, useState } from 'react'
import { Clock3 } from 'lucide-react'
import { Icon } from '../../ui/Icon'
import {
  deadlineFromHours,
  formatPollDeadline,
  localDeadlineInput,
} from '../../../features/polls/poll-deadline'
import './PollDeadlinePicker.css'
const presets = [
  ['1', '1 hour'],
  ['4', '4 hours'],
  ['24', '24 hours'],
  ['custom', 'Choose a time'],
] as const
export function PollDeadlinePicker({
  value,
  onChange,
  disabled,
  editing,
}: {
  value: string
  onChange: (value: string) => void
  disabled: boolean
  editing: boolean
}) {
  const id = useId()
  const [preset, setPreset] = useState(editing ? 'custom' : '4')
  return (
    <fieldset className="poll-deadline-picker" disabled={disabled} aria-describedby={id + '-help'}>
      <legend>
        <Icon icon={Clock3} /> Voting closes
      </legend>
      <p className="note" id={id + '-help'}>
        A little time to decide. Voting stops automatically at the closing time.
      </p>
      <div className="poll-deadline-picker__presets">
        {presets.map(([key, label]) => (
          <label key={key} className="poll-deadline-picker__preset">
            <input
              type="radio"
              name={id}
              checked={preset === key}
              onChange={() => {
                setPreset(key)
                if (key !== 'custom') onChange(deadlineFromHours(Number(key)))
              }}
            />
            <span>{label}</span>
          </label>
        ))}
      </div>
      {preset === 'custom' && (
        <div className="poll-deadline-picker__custom">
          <label htmlFor={id + '-date'}>Closing date and time</label>
          <input
            id={id + '-date'}
            type="datetime-local"
            required
            value={localDeadlineInput(value)}
            onInput={(e) => {
              const date = new Date(e.currentTarget.value)
              onChange(Number.isNaN(date.getTime()) ? '' : date.toISOString())
            }}
          />
          <p className="note">Your time: {Intl.DateTimeFormat().resolvedOptions().timeZone}.</p>
        </div>
      )}
      <p className="poll-deadline-picker__preview">
        {value ? (
          <>
            Voting closes <time dateTime={value}>{formatPollDeadline(value)}</time>.
          </>
        ) : (
          'Choose a closing date and time.'
        )}
      </p>
    </fieldset>
  )
}
