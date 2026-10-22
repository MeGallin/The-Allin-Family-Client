import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PollDeadlinePicker } from './PollDeadlinePicker'
import { deadlineFromHours, localDeadlineInput } from '../../../features/polls/poll-deadline'
function Fixture({ editing = false }: { editing?: boolean }) {
  const [value, setValue] = useState(deadlineFromHours())
  return (
    <>
      <PollDeadlinePicker value={value} onChange={setValue} disabled={false} editing={editing} />
      <output data-testid="instant">{value}</output>
    </>
  )
}
describe('poll closing-time widget', () => {
  it('defaults to four hours, supports shortcuts and updates the submitted instant on native input', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-22T12:00:00Z'))
    render(<Fixture />)
    expect((screen.getByRole('radio', { name: '4 hours' }) as HTMLInputElement).checked).toBe(true)
    expect(screen.getByTestId('instant').textContent).toBe('2026-10-22T16:00:00.000Z')
    fireEvent.click(screen.getByRole('radio', { name: '1 hour' }))
    expect(screen.getByTestId('instant').textContent).toBe('2026-10-22T13:00:00.000Z')
    fireEvent.click(screen.getByRole('radio', { name: '24 hours' }))
    expect(screen.getByTestId('instant').textContent).toBe('2026-10-23T12:00:00.000Z')
    fireEvent.click(screen.getByRole('radio', { name: 'Choose a time' }))
    const local = localDeadlineInput('2026-10-22T12:05:00Z')
    fireEvent.input(screen.getByLabelText('Closing date and time'), { target: { value: local } })
    expect(screen.getByTestId('instant').textContent).toBe(new Date(local).toISOString())
  })
  it('retains an edited deadline, and clearing the custom field clears the submitted value', () => {
    render(<Fixture editing />)
    expect((screen.getByRole('radio', { name: 'Choose a time' }) as HTMLInputElement).checked).toBe(
      true,
    )
    fireEvent.input(screen.getByLabelText('Closing date and time'), { target: { value: '' } })
    expect(screen.getByTestId('instant').textContent).toBe('')
    expect(screen.getByText('Choose a closing date and time.')).toBeTruthy()
  })
})
