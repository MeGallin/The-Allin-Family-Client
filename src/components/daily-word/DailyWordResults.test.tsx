import { useState } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { DraftProtectionProvider } from '../../features/drafts/DraftProtection'
import type { useDailyWord } from '../../features/daily-word/useDailyWord'
import { wordSnapshot, wordReceipt } from '../../test/daily-word-fixtures'
import { testUser } from '../../test/fixtures'
import DailyWordResults from './DailyWordResults'
type Controller = ReturnType<typeof useDailyWord>
const slot = vi.hoisted(() => ({
  word: null as unknown as Controller,
  results: [] as {
    date: string
    ownerId: number
    name: string
    attempts: number
    solved: boolean
  }[],
}))
vi.mock('../../features/daily-word/useDailyWord', () => ({ useDailyWord: () => slot.word }))
vi.mock('../../services/daily-word-query', () => ({
  dailyWordApi: {
    useGetDailyWordResultsQuery: () => ({
      data: { results: slot.results },
      isLoading: false,
      isFetching: false,
      error: undefined,
      refetch: vi.fn(),
    }),
  },
}))
vi.mock('../../app/store-hooks', () => ({ useAppSelector: () => testUser.id }))
vi.mock('../../hooks/useLiveQueryOptions', () => ({ useLiveQueryOptions: () => ({ skip: false }) }))
function mount(installed = true) {
  let update: (value: Partial<Controller>) => void
  const data = wordSnapshot({
    installed,
    week: [
      { date: '2026-10-24', revision: 8, shared: true, attempts: 6, finished: true, solved: false },
    ],
  })
  const word: Controller = {
    ownerId: testUser.id,
    data,
    known: true,
    installed,
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
  }
  function Harness() {
    const [current, setCurrent] = useState(word)
    slot.word = current
    update = (value) => setCurrent((c) => ({ ...c, ...value }))
    return (
      <DraftProtectionProvider>
        <DailyWordResults />
      </DraftProtectionProvider>
    )
  }
  render(
    <RouterProvider
      router={createMemoryRouter([{ path: '*', element: <Harness /> }], {
        initialEntries: ['/my-space?view=family&tool=word-results'],
      })}
    />,
  )
  return { word, update: (value: Partial<Controller>) => act(() => update(value)) }
}
describe('Daily Word spoiler-free family results', () => {
  it('allows an uninstalled viewer and renders only explicitly shared finished result fields', () => {
    slot.results = [
      { date: '2026-10-24', ownerId: 202, name: 'Fixture member', attempts: 6, solved: false },
    ]
    mount(false)
    expect(screen.getByText('Fixture member')).toBeTruthy()
    expect(screen.getByText('Finished · 6 / 6')).toBeTruthy()
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(screen.queryByRole('img')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Withdraw my result' })).toBeNull()
    expect(screen.getByRole('link', { name: 'Play today' }).getAttribute('href')).toContain(
      'tool=word',
    )
  })
  it('withdraws an older own result using its private revision and preserves an unresolved exact key after error reset', async () => {
    slot.results = [
      {
        date: '2026-10-24',
        ownerId: testUser.id,
        name: 'Fixture owner',
        attempts: 6,
        solved: false,
      },
    ]
    const view = mount(),
      failure = { status: 0, code: '', message: 'Unconfirmed' }
    const write = vi
      .fn<Controller['write']>()
      .mockImplementationOnce(async () => {
        view.update({ failure, error: failure.message })
        return { receipt: null, failure }
      })
      .mockResolvedValueOnce({ receipt: wordReceipt(), failure: null })
    view.update({ write })
    fireEvent.click(screen.getByRole('button', { name: 'Withdraw my result' }))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Retry withdrawal' })).toBeTruthy(),
    )
    view.update({ failure: undefined, error: '' })
    expect(screen.getByRole('button', { name: 'Retry withdrawal' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Load latest status' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Retry withdrawal' }))
    await waitFor(() => expect(screen.getByRole('status').textContent).toContain('withdrawn'))
    expect(write.mock.calls).toHaveLength(2)
    expect(write.mock.calls[1]).toEqual(write.mock.calls[0])
    expect(write.mock.calls[0][1]).toMatchObject({ day: '2026-10-24', revision: 8, version: 1 })
    expect(Object.keys(write.mock.calls[0][1]).sort()).toEqual([
      'day',
      'requestKey',
      'revision',
      'version',
    ])
  })
})
