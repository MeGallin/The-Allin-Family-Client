import { useState } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Link, createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { DraftProtectionProvider } from '../../features/drafts/DraftProtection'
import type { useFocusTimer } from '../../features/focus-timer/useFocusTimer'
import type { FocusSnapshot, FocusWriteResult } from '../../features/focus-timer/types'
import { focusSnapshot, focusSession, focusReceipt } from '../../test/focus-timer-fixtures'
import { deferred } from '../../test/fixtures'
import FocusTimerWorkspace from './FocusTimerWorkspace'
type Controller = ReturnType<typeof useFocusTimer>
const slot = vi.hoisted(() => ({ current: null as unknown as Controller }))
vi.mock('../../features/focus-timer/useFocusTimer', () => ({ useFocusTimer: () => slot.current }))
function mount(data = focusSnapshot(), overrides: Partial<Controller> = {}) {
  let update: (value: Partial<Controller>) => void
  const controller: Controller = {
    ownerId: data.ownerId,
    data,
    known: true,
    installed: data.installed,
    pending: false,
    feedback: '',
    loading: false,
    offline: false,
    failure: undefined,
    error: '',
    clearError: vi.fn(),
    refresh: vi.fn(),
    write: vi.fn(async () => null),
    removals: {},
    remove: vi.fn(() => false),
    undoRemove: vi.fn(),
    ...overrides,
  }
  function Harness() {
    const [current, setCurrent] = useState(controller)
    slot.current = current
    update = (value) => setCurrent((c) => ({ ...c, ...value }))
    return (
      <DraftProtectionProvider>
        <FocusTimerWorkspace onInstall={vi.fn()} />
        <Link to="/elsewhere">Leave timer</Link>
      </DraftProtectionProvider>
    )
  }
  render(
    <RouterProvider
      router={createMemoryRouter([{ path: '*', element: <Harness /> }], {
        initialEntries: ['/my-space?view=widgets&tool=focus'],
      })}
    />,
  )
  return { controller, update: (value: Partial<Controller>) => act(() => update(value)) }
}
const minutes = () => screen.getByRole('spinbutton', { name: 'Custom minutes' }) as HTMLInputElement
const label = () => screen.getByRole('textbox', { name: /Session label/ }) as HTMLInputElement
const writeResult = (s: FocusSnapshot): FocusWriteResult => ({
  receipt: focusReceipt(s),
  failure: null,
})
describe('Focus Desk real component controls and recovery', () => {
  it('selects resting Ready/Paused and active Running/Elapsed orientations without writes', () => {
    vi.spyOn(performance, 'now').mockReturnValue(0)
    const view = mount()
    const orientation = () => document.querySelector('.ft-glass-turn')!.getAttribute('data-resting')
    expect(orientation()).toBe('true')
    view.update({
      data: focusSnapshot({ version: 2, session: focusSession({ elapsedMs: 125432 }) }),
    })
    expect(orientation()).toBe('false')
    view.update({
      data: focusSnapshot({
        version: 3,
        session: focusSession({ state: 'paused', elapsedMs: 125432 }),
      }),
    })
    expect(orientation()).toBe('true')
    expect(screen.getByRole('timer').textContent).toBe('02:55')
    view.update({
      data: focusSnapshot({ version: 4, session: focusSession({ elapsedMs: 125432 }) }),
    })
    expect(orientation()).toBe('false')
    view.update({
      data: focusSnapshot({
        version: 5,
        session: focusSession({ state: 'elapsed', elapsedMs: 300000 }),
      }),
    })
    expect(orientation()).toBe('false')
    expect(screen.getByRole('timer').textContent).toBe('00:00')
    view.update({ data: focusSnapshot({ version: 6 }) })
    expect(orientation()).toBe('true')
    expect(view.controller.write).not.toHaveBeenCalled()
  })
  it('keeps the lower glass full when the local countdown reaches zero before server refresh', async () => {
    vi.useFakeTimers()
    mount(focusSnapshot({ session: focusSession({ elapsedMs: 299000 }) }))
    await act(() => vi.advanceTimersByTimeAsync(2000))
    expect(screen.getByRole('timer').textContent).toBe('00:00')
    expect(document.querySelector('.ft-hourglass rect')!.getAttribute('y')).toBe('148')
    expect((document.querySelector('.ft-hourglass') as SVGSVGElement).dataset.flowing).toBe('false')
    expect(screen.getByRole('button', { name: 'Start 5-minute break' })).toBeTruthy()
    expect(slot.current.write).not.toHaveBeenCalled()
  })
  it('shows positive sub-minute early history accurately without rounding it to zero', () => {
    mount(
      focusSnapshot({
        history: [
          focusSession({ state: 'early', elapsedMs: 20500, endedAt: '2026-10-25T10:00:20.500Z' }),
        ],
      }),
    )
    fireEvent.click(screen.getByText('Your last seven days'))
    expect(screen.getByText(/Ended early · <1 timed min/)).toBeTruthy()
  })
  it('shows actual empty ready data, seven days and bounded180minute setup', () => {
    mount()
    expect(screen.getByRole('timer').textContent).toBe('25:00')
    expect(screen.getByText('No recent sessions yet.')).toBeTruthy()
    fireEvent.click(screen.getByText('Your last seven days'))
    expect(screen.getAllByRole('listitem')).toHaveLength(7)
    fireEvent.change(minutes(), { target: { value: '180' } })
    expect(screen.getByRole('timer').textContent).toBe('180:00')
    expect(
      (screen.getByRole('button', { name: 'Start focus' }) as HTMLButtonElement).disabled,
    ).toBe(false)
    for (const value of ['0', '181', '5.5']) {
      fireEvent.change(minutes(), { target: { value } })
      expect(
        (screen.getByRole('button', { name: 'Start focus' }) as HTMLButtonElement).disabled,
      ).toBe(true)
    }
  })
  it('keeps uninstalled preview private/disabled without inventing sessions', () => {
    mount(focusSnapshot({ installed: false, version: 0, generation: 0 }))
    expect(screen.getByRole('button', { name: 'Install personal Focus Timer' })).toBeTruthy()
    expect(minutes().disabled).toBe(true)
    expect(label().disabled).toBe(true)
    expect(screen.queryByRole('button', { name: 'Pause' })).toBeNull()
  })
  it('adopts a custom-duration Start after its acknowledgement despite the earlier dirty draft', async () => {
    const view = mount(),
      next = focusSnapshot({
        version: 2,
        defaults: { focus: 15, short: 5, long: 15 },
        session: focusSession({ durationMs: 900000, label: 'Synthetic reading' }),
      })
    const write = vi.fn<Controller['write']>(async () => {
      view.update({ data: next })
      return writeResult(next)
    })
    view.update({ write })
    fireEvent.change(minutes(), { target: { value: '15' } })
    fireEvent.change(label(), { target: { value: 'Synthetic reading' } })
    fireEvent.click(screen.getByRole('button', { name: 'Start focus' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Pause' })).toBeTruthy())
    expect(screen.getByRole('timer').textContent).toBe('15:00')
    expect(write.mock.calls[0]).toMatchObject([
      'start',
      {
        version: 1,
        generation: 1,
        sessionId: null,
        phase: 'focus',
        minutes: 15,
        label: 'Synthetic reading',
      },
    ])
    expect(label().disabled).toBe(true)
  })
  it('does not adopt an old current snapshot after an accepted action when follow-up read failed', async () => {
    const view = mount(),
      next = focusSnapshot({ version: 2, session: focusSession() })
    view.update({
      write: vi.fn(async () => writeResult(next)),
      refresh: () => view.update({ data: next }),
    })
    fireEvent.click(screen.getByRole('button', { name: 'Start focus' }))
    await waitFor(() =>
      expect(screen.getByText(/Your action is saved. Refresh to load/)).toBeTruthy(),
    )
    // Flush passive adoption effects too: an old snapshot must never clear the
    // accepted version and silently re-enable a duplicate Start.
    await act(async () => {
      await Promise.resolve()
    })
    view.update({ data: { ...view.controller.data! } })
    await act(async () => {
      await Promise.resolve()
    })
    expect(screen.getByText(/Your action is saved. Refresh to load/)).toBeTruthy()
    expect(
      (screen.getByRole('button', { name: 'Start focus' }) as HTMLButtonElement).disabled,
    ).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Pause' })).toBeTruthy())
  })
  it('keeps an uncertain exact request blocked/retryable after Refresh clears the network error', async () => {
    const view = mount(),
      failure = { status: 0, code: '', message: 'Unconfirmed' },
      next = focusSnapshot({ version: 2, session: focusSession() })
    const write = vi
      .fn<Controller['write']>()
      .mockImplementationOnce(async () => {
        view.update({ failure, error: failure.message })
        return { receipt: null, failure }
      })
      .mockImplementationOnce(async () => {
        view.update({ data: next, failure: undefined, error: '' })
        return writeResult(next)
      })
    view.update({ write, refresh: () => view.update({ failure: undefined, error: '' }) })
    fireEvent.click(screen.getByRole('button', { name: 'Start focus' }))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Retry same action' })).toBeTruthy(),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Refresh status' }))
    expect(minutes().disabled).toBe(true)
    expect(screen.queryByRole('button', { name: 'Load latest timer' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Retry same action' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Pause' })).toBeTruthy())
    expect(write.mock.calls[1]).toEqual(write.mock.calls[0])
  })
  it('preserves a prepared private label through conflict until guarded explicit loading', async () => {
    const view = mount(),
      latest = focusSnapshot({
        version: 3,
        session: focusSession({ label: 'Other device session' }),
      }),
      failure = { status: 409, code: 'focus_conflict', message: 'Changed' }
    view.update({
      write: vi.fn(async () => {
        view.update({ data: latest, failure, error: failure.message })
        return { receipt: null, failure }
      }),
    })
    fireEvent.change(label(), { target: { value: 'Unaccepted label' } })
    fireEvent.click(screen.getByRole('button', { name: 'Start focus' }))
    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: 'Load latest timer' })).toHaveLength(2),
    )
    expect(label().value).toBe('Unaccepted label')
    fireEvent.click(screen.getAllByRole('button', { name: 'Load latest timer' })[0])
    fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }))
    expect(label().value).toBe('Unaccepted label')
    fireEvent.click(screen.getAllByRole('button', { name: 'Load latest timer' })[0])
    fireEvent.click(screen.getByRole('button', { name: 'Discard changes' }))
    await waitFor(() => expect(screen.getByText('Other device session')).toBeTruthy())
  })
  it('uses actual long-break duration for pressed presets and blocks offline mutations', () => {
    const view = mount(
      focusSnapshot({ session: focusSession({ phase: 'long', durationMs: 900000 }) }),
      { offline: true, error: 'Offline' },
    )
    expect(screen.getByRole('button', { name: '15 min' }).getAttribute('aria-pressed')).toBe('true')
    expect((screen.getByRole('button', { name: 'Pause' }) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByText('Offline estimate')).toBeTruthy()
    expect(view.controller.write).not.toHaveBeenCalled()
  })
  it('offers a manual next phase at elapsed state and never starts it automatically', async () => {
    const current = focusSnapshot({
        session: focusSession({ state: 'elapsed', elapsedMs: 300000 }),
      }),
      view = mount(current),
      next = focusSnapshot({
        version: 2,
        session: focusSession({ id: '502', phase: 'short', durationMs: 300000 }),
      })
    expect(view.controller.write).not.toHaveBeenCalled()
    view.update({
      write: vi.fn(async () => {
        view.update({ data: next })
        return writeResult(next)
      }),
    })
    fireEvent.click(screen.getByRole('button', { name: 'Start 5-minute break' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Pause' })).toBeTruthy())
    expect(slot.current.write).toHaveBeenCalledWith(
      'next',
      expect.objectContaining({ sessionId: '501', phase: 'short', minutes: 5, label: '' }),
    )
    expect(screen.getByRole('timer').textContent).toBe('05:00')
  })
  it('guards early Finish and Reset, allowing Keep timer without a write', async () => {
    const view = mount(focusSnapshot({ session: focusSession() }))
    fireEvent.click(screen.getByRole('button', { name: 'Finish session' }))
    expect(screen.getByRole('dialog', { name: 'Finish this session early?' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Keep timer' }))
    expect(view.controller.write).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(screen.getByRole('dialog', { name: 'Reset this session?' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Keep timer' }))
    expect(view.controller.write).not.toHaveBeenCalled()
  })
  it('reports an at-deadline Pause receipt as elapsed even if the local timer already reached zero', async () => {
    vi.useFakeTimers()
    const waiting = deferred<FocusWriteResult>(),
      current = focusSnapshot({ session: focusSession({ elapsedMs: 299000 }) }),
      view = mount(current, { write: vi.fn(() => waiting.promise) })
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }))
    await act(() => vi.advanceTimersByTimeAsync(1000))
    const next = focusSnapshot({
      version: 2,
      session: focusSession({ state: 'elapsed', elapsedMs: 300000 }),
    })
    await act(async () => {
      view.update({ data: next })
      waiting.resolve(writeResult(next))
      await Promise.resolve()
    })
    expect(screen.getByRole('button', { name: 'Start 5-minute break' })).toBeTruthy()
    expect(
      screen
        .getAllByRole('status')
        .some((e) => e.textContent?.includes('reached its planned duration')),
    ).toBe(true)
    expect(screen.queryByText('Your timer is paused.')).toBeNull()
  })
  it('stops hidden repaint callbacks then derives elapsed display on visibility return without per-second writes', async () => {
    vi.useFakeTimers()
    let hidden = false
    vi.spyOn(document, 'hidden', 'get').mockImplementation(() => hidden)
    const view = mount(focusSnapshot({ session: focusSession() }))
    await act(() => vi.advanceTimersByTimeAsync(1000))
    expect(screen.getByRole('timer').textContent).toBe('04:59')
    hidden = true
    act(() => document.dispatchEvent(new Event('visibilitychange')))
    await act(() => vi.advanceTimersByTimeAsync(5000))
    expect(screen.getByRole('timer').textContent).toBe('04:59')
    hidden = false
    act(() => document.dispatchEvent(new Event('visibilitychange')))
    expect(screen.getByRole('timer').textContent).toBe('04:54')
    expect(view.controller.write).not.toHaveBeenCalled()
    expect(screen.getByRole('timer').getAttribute('aria-live')).toBe('off')
  })
  it('tolerates an older cached snapshot missing newly added days until authoritative refresh', () => {
    const old = focusSnapshot()
    delete (old as Partial<FocusSnapshot>).days
    mount(old)
    expect(screen.getByRole('timer').textContent).toBe('25:00')
  })
})
