import { useState } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Link, createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { DraftProtectionProvider } from '../../features/drafts/DraftProtection'
import type { useDailyWord } from '../../features/daily-word/useDailyWord'
import type { WordSnapshot } from '../../features/daily-word/types'
import { wordSnapshot, wordReceipt } from '../../test/daily-word-fixtures'
import DailyWordWorkspace from './DailyWordWorkspace'
type Controller = ReturnType<typeof useDailyWord>
const slot = vi.hoisted(() => ({ current: null as unknown as Controller }))
vi.mock('../../features/daily-word/useDailyWord', () => ({ useDailyWord: () => slot.current }))
vi.mock('../../hooks/useNow', () => ({ useNow: () => Date.parse('2026-10-25T10:00:00Z') }))
function mount(overrides: Partial<Controller> = {}, data = wordSnapshot()) {
  let update: (extra: Partial<Controller>) => void
  const controller: Controller = {
    ownerId: data.ownerId,
    data,
    known: true,
    installed: true,
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
    update = (extra) => setCurrent((c) => ({ ...c, ...extra }))
    return (
      <DraftProtectionProvider>
        <DailyWordWorkspace onInstall={vi.fn()} />
        <Link to="/elsewhere">Leave game</Link>
      </DraftProtectionProvider>
    )
  }
  const router = createMemoryRouter([{ path: '*', element: <Harness /> }], {
    initialEntries: ['/my-space?view=widgets&tool=word'],
  })
  render(<RouterProvider router={router} />)
  return { controller, update: (extra: Partial<Controller>) => act(() => update(extra)), router }
}
const input = () => screen.getByRole('textbox', { name: 'Your next guess' }) as HTMLInputElement
const type = (word: string) => fireEvent.change(input(), { target: { value: word } })
const submit = () => fireEvent.submit(input().closest('form')!)
const saved = (word = 'crane'): WordSnapshot => {
  const base = wordSnapshot()
  return {
    ...base,
    progress: {
      ...base.progress,
      revision: 1,
      guesses: [{ word, marks: ['absent', 'absent', 'correct', 'absent', 'correct'] }],
    },
  }
}
describe('Daily Word board, exact retries and guarded drafts', () => {
  it('offers labelled physical input, keypad/backspace and readable non-colour saved feedback', () => {
    mount({}, saved())
    expect(screen.getAllByRole('img')).toHaveLength(30)
    expect(screen.getByRole('img', { name: 'C, not in the remaining word' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'P' }))
    expect(input().value).toBe('P')
    fireEvent.click(screen.getByRole('button', { name: '⌫ Backspace' }))
    expect(input().value).toBe('')
    type('apple')
    expect(input().value).toBe('APPLE')
    expect(screen.queryByRole('button', { name: 'Undo' })).toBeNull()
  })
  it('retains editable letters after a definitive invalid-word rejection without consuming a row', async () => {
    const view = mount()
    const failure = { status: 422, code: 'word_invalid', message: 'Not in dictionary' }
    view.update({
      write: vi.fn(async () => {
        view.update({ failure, error: failure.message })
        return { receipt: null, failure }
      }),
    })
    type('ZZZZZ')
    submit()
    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toContain('Not in dictionary'),
    )
    expect(input().readOnly).toBe(false)
    expect(input().value).toBe('ZZZZZ')
    expect(screen.queryByLabelText('Guess 1, saved')).toBeNull()
    type('crane')
    expect(input().value).toBe('CRANE')
  })
  it('keeps an uncertain exact key locked and retryable after Refresh clears the error', async () => {
    const view = mount(),
      failure = { status: 0, code: '', message: 'Response unconfirmed' }
    const write = vi
      .fn<Controller['write']>()
      .mockImplementationOnce(async () => {
        view.update({ failure, error: failure.message })
        return { receipt: null, failure }
      })
      .mockImplementationOnce(async () => {
        const next = saved()
        view.update({ data: next, failure: undefined, error: '' })
        return { receipt: wordReceipt(next), failure: null }
      })
    view.update({ write, refresh: () => view.update({ failure: undefined, error: '' }) })
    type('crane')
    submit()
    await waitFor(() => expect(input().readOnly).toBe(true))
    fireEvent.click(screen.getByRole('button', { name: 'Refresh status' }))
    expect(input().readOnly).toBe(true)
    expect(input().value).toBe('CRANE')
    fireEvent.click(screen.getByRole('button', { name: 'Retry same request' }))
    await waitFor(() => expect(input().value).toBe(''))
    expect(write).toHaveBeenCalledTimes(2)
    expect(write.mock.calls[1]).toEqual(write.mock.calls[0])
    await waitFor(() =>
      expect(screen.getByRole('img', { name: 'C, not in the remaining word' })).toBeTruthy(),
    )
    expect(screen.getAllByRole('status').some((s) => s.textContent?.includes('CRANE saved.'))).toBe(
      true,
    )
    expect(screen.getByText('CRANE saved · 1 / 6')).toBeTruthy()
    const detailed = screen
      .getAllByRole('status')
      .find((s) => s.textContent?.includes('CRANE saved.'))!
    expect(detailed.classList.contains('sr-only')).toBe(true)
    expect(detailed.textContent).toContain('C: not in the remaining word')
  })
  it('keeps a typed draft across another-window CAS change until explicit guarded loading', async () => {
    const view = mount()
    type('apple')
    view.update({ data: saved() })
    expect(input().value).toBe('APPLE')
    expect(input().readOnly).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Load latest board' }))
    expect(screen.getByRole('dialog')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }))
    expect(input().value).toBe('APPLE')
    fireEvent.click(screen.getByRole('button', { name: 'Load latest board' }))
    fireEvent.click(screen.getByRole('button', { name: 'Discard changes' }))
    await waitFor(() => expect(input().value).toBe(''))
    expect(screen.getByLabelText('Guess 1, saved')).toBeTruthy()
  })
  it('never applies a retained typed word silently to the next London day', async () => {
    const view = mount()
    type('apple')
    view.update({
      data: wordSnapshot({
        day: '2026-10-26',
        clock: {
          currentDay: '2026-10-26',
          serverTime: '2026-10-26T00:01:00Z',
          nextMidnight: '2026-10-27T00:00:00Z',
        },
      }),
    })
    expect(input().value).toBe('APPLE')
    expect(input().readOnly).toBe(true)
    expect(view.controller.write).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Open today’s word' }))
    expect(screen.getByRole('dialog')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Discard changes' }))
    await waitFor(() => expect(input().value).toBe(''))
    expect(screen.getByLabelText('Your private board for 2026-10-26')).toBeTruthy()
  })
  it('offers explicit share/withdraw only after completion and sends no client score', async () => {
    const base = saved('apple')
    base.progress.finished = true
    base.progress.solved = true
    const view = mount({}, base),
      write = vi.fn<Controller['write']>(async (action, body) => {
        const next = {
          ...base,
          progress: {
            ...base.progress,
            shared: action === 'share',
            revision: base.progress.revision + 1,
          },
        }
        view.update({ data: next })
        return { receipt: wordReceipt(next), failure: null }
      })
    view.update({ write })
    expect(screen.queryByRole('textbox')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Share finished result' }))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Withdraw shared result' })).toBeTruthy(),
    )
    expect(write.mock.calls[0][0]).toBe('share')
    expect(Object.keys(write.mock.calls[0][1]).sort()).toEqual([
      'day',
      'requestKey',
      'revision',
      'version',
    ])
    fireEvent.click(screen.getByRole('button', { name: 'Withdraw shared result' }))
    await waitFor(() => expect(write.mock.calls[1][0]).toBe('withdraw'))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Share finished result' })).toBeTruthy(),
    )
    expect(screen.queryByText(/Your board or installation changed/)).toBeNull()
  })
  it('shows an explicit saved loss without a guess input, restart or silent result publication', () => {
    const data = wordSnapshot()
    data.progress = {
      ...data.progress,
      finished: true,
      revision: 6,
      guesses: ['crane', 'slate', 'house', 'train', 'world', 'beach'].map((word) => ({
        word,
        marks: ['absent', 'absent', 'absent', 'absent', 'absent'],
      })),
    }
    mount({}, data)
    expect(screen.getByText(/No match today. All six guesses are saved/)).toBeTruthy()
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(screen.getByRole('button', { name: 'Share finished result' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Restart/ })).toBeNull()
  })
})
