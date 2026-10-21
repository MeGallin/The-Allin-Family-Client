import { useId, useState, type FormEvent } from 'react'
import { useFamilyData } from '../../../features/family/useFamilyData'
import { dateInputValue } from '../../../lib/dates'
import { Modal } from '../../ui/Modal'
import './EventComposer.css'

export default function EventComposer({ onClose }: { onClose: () => void }) {
  const { addEvent } = useFamilyData()
  const id = useId()
  const [error, setError] = useState('')

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const title = String(form.get('title') || '').trim()
    const day = String(form.get('day') || '')
    const time = String(form.get('time') || '')
    const detail = String(form.get('detail') || '').trim()
    const date = new Date(day + 'T' + time)
    if (!title.trim() || Number.isNaN(date.getTime())) {
      setError('Add a title, date and time for your plan.')
      return
    }
    addEvent({ title: title.trim(), startsAt: date.toISOString(), detail: detail.trim() })
    onClose()
  }

  return (
    <Modal title="Make a plan" onClose={onClose}>
      <p className="note">Try an event in this preview. It will reset when you refresh.</p>
      <form onSubmit={submit}>
        <label htmlFor={id + '-title'}>What’s the plan?</label>
        <input id={id + '-title'} required maxLength={80} name="title" />
        <div className="event-composer__when">
          <div>
            <label htmlFor={id + '-day'}>Date</label>
            <input
              id={id + '-day'}
              type="date"
              required
              name="day"
              defaultValue={dateInputValue(new Date())}
            />
          </div>
          <div>
            <label htmlFor={id + '-time'}>Time</label>
            <input id={id + '-time'} type="time" required name="time" defaultValue="12:00" />
          </div>
        </div>
        <label htmlFor={id + '-detail'}>
          Anything to know <span className="field-optional">(optional)</span>
        </label>
        <textarea id={id + '-detail'} rows={3} maxLength={300} name="detail" />
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="actions">
          <button type="submit">Add to preview</button>
          <button type="button" className="secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  )
}
