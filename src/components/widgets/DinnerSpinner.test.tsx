import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DinnerSpinner } from './DinnerSpinner'
import type { DinnerSpin, FamilyWidget } from '../../features/widgets/types'
vi.mock('./DinnerWheel', () => ({ DinnerWheel: () => <div>Wheel</div> }))
vi.mock('../ui/FriendlyTime', () => ({ FriendlyTime: () => <span>Saved time</span> }))
const trial: DinnerSpin = {
  id: 's1',
  widgetId: '1',
  mealId: 'm1',
  mealVersion: 1,
  meal: 'Soup',
  actor: { id: 1, name: 'Dad' },
  occurredAt: '2026-10-24T10:00:00Z',
}
const widget = (saved = true): FamilyWidget => ({
  id: '1',
  kind: 'dinner-spinner',
  title: 'Family meals',
  visibility: 'family',
  owner: { id: 1, name: 'Dad' },
  version: 1,
  hidden: false,
  createdAt: '2026-10-24T10:00:00Z',
  updatedAt: '2026-10-24T10:00:00Z',
  meals: [
    { id: 'm1', title: 'Soup', version: 1 },
    { id: 'm2', title: 'Pasta', version: 1 },
  ],
  spins: saved ? [trial] : [],
  publications: [],
})
describe('Private spinning failure and rapid clicks', () => {
  it('prevents duplicate spins while awaiting the server and animation', async () => {
    vi.useFakeTimers()
    let resolve!: (spin: DinnerSpin) => void
    const onSpin = vi.fn(() => new Promise<DinnerSpin>((done) => (resolve = done)))
    render(<DinnerSpinner widget={widget(false)} disabled={false} onSpin={onSpin} />)
    const button = screen.getByRole('button', { name: 'Spin for dinner' })
    fireEvent.click(button)
    fireEvent.click(button)
    expect(onSpin).toHaveBeenCalledTimes(1)
    await act(async () => resolve(trial))
    expect(
      (screen.getByRole('button', { name: 'Choosing dinner…' }) as HTMLButtonElement).disabled,
    ).toBe(true)
    await act(async () => vi.advanceTimersByTimeAsync(2100))
    expect(screen.getByRole('heading', { name: 'Soup' })).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Spin again' }) as HTMLButtonElement).disabled).toBe(
      false,
    )
  })
  it('keeps the confirmed pick and retry key after a failed save', async () => {
    vi.useFakeTimers()
    const onSpin = vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(trial)
    render(<DinnerSpinner widget={widget()} disabled={false} onSpin={onSpin} />)
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Spin again' })))
    expect(screen.getByRole('alert').textContent).toContain('couldn’t confirm')
    expect(screen.getByRole('heading', { name: 'Soup' })).toBeTruthy()
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Spin again' })))
    expect(onSpin.mock.calls[0][0]).toBe(onSpin.mock.calls[1][0])
    await act(async () => vi.advanceTimersByTimeAsync(2100))
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.getByText(/Same meal again/)).toBeTruthy()
  })
  it('recovers controls from an unexpected rejection', async () => {
    const onSpin = vi.fn().mockRejectedValue(new Error('Network failed'))
    render(<DinnerSpinner widget={widget()} disabled={false} onSpin={onSpin} />)
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Spin again' })))
    expect(screen.getByRole('alert').textContent).toContain('couldn’t finish')
    expect((screen.getByRole('button', { name: 'Spin again' }) as HTMLButtonElement).disabled).toBe(
      false,
    )
  })
  it('rejects stale renamed-back trials and empty wheels without crashing', () => {
    const saved = widget()
    saved.meals[0].version = 3
    const view = render(<DinnerSpinner widget={saved} disabled={false} onSpin={vi.fn()} />)
    expect(
      (screen.getByRole('button', { name: 'Publish this pick' }) as HTMLButtonElement).disabled,
    ).toBe(true)
    expect(screen.getByText(/meal changed or was removed/)).toBeTruthy()
    view.rerender(
      <DinnerSpinner widget={{ ...saved, meals: [] }} disabled={false} onSpin={vi.fn()} />,
    )
    expect((screen.getByRole('button', { name: 'Spin again' }) as HTMLButtonElement).disabled).toBe(
      true,
    )
  })
})
