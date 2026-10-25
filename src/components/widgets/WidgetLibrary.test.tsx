import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import type { FamilyWidget } from '../../features/widgets/types'
import { WidgetLibrary } from './WidgetLibrary'

const installation = (id: string, overrides: Partial<FamilyWidget> = {}): FamilyWidget => ({
  id,
  kind: 'dinner-spinner',
  title: 'Saved wheel ' + id,
  visibility: 'family',
  owner: { id: 1, name: 'Dad' },
  version: 1,
  hidden: false,
  createdAt: '2026-10-24T12:00:00Z',
  updatedAt: '2026-10-24T12:00:00Z',
  meals: [],
  spins: [],
  publications: [],
  ...overrides,
})
function mount(overrides: Partial<Parameters<typeof WidgetLibrary>[0]> = {}) {
  const onAdd = vi.fn()
  const router = createMemoryRouter(
    [
      {
        path: '*',
        element: (
          <WidgetLibrary
            onAdd={onAdd}
            installations={[]}
            loading={false}
            error={false}
            sudoku={{
              installed: false,
              ready: true,
              loading: false,
              removing: false,
              onInstall: vi.fn(),
            }}
            focus={{
              installed: false,
              ready: true,
              loading: false,
              removing: false,
              onInstall: vi.fn(),
            }}
            word={{
              installed: false,
              ready: true,
              loading: false,
              removing: false,
              onInstall: vi.fn(),
            }}
            {...overrides}
          />
        ),
      },
    ],
    { initialEntries: ['/my-space?view=library'] },
  )
  render(<RouterProvider router={router} />)
  return { onAdd, router }
}
function detail(name: string) {
  fireEvent.click(screen.getByRole('button', { name: 'About ' + name }))
  return screen.getByRole('dialog', { name: 'Widget Store' })
}

describe('Widget Store catalogue and real action boundaries', () => {
  it('opens installed built-ins at their canonical tools and offers real Dinner installation', () => {
    const { onAdd, router } = mount()
    expect(screen.getByRole('link', { name: 'Open Shopping List' }).getAttribute('href')).toBe(
      '/my-space?view=family&tool=shopping',
    )
    expect(screen.getByRole('link', { name: 'Open Polls' }).getAttribute('href')).toBe(
      '/my-space?view=family&tool=polls',
    )
    expect(screen.getByText('Available · Personal or family')).not.toBeNull()
    expect(
      (screen.getByRole('button', { name: 'Install Sudoku' }) as HTMLButtonElement).disabled,
    ).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: 'Install Dinner Spinner' }))
    expect(onAdd).toHaveBeenCalledOnce()
    expect(router.state.location.search).toBe('?view=library')
    fireEvent.click(screen.getByRole('link', { name: 'Open Polls' }))
    expect(router.state.location.search).toBe('?view=family&tool=polls')
    expect(fetch).not.toHaveBeenCalled()
  })
  it('uses actual personal/family installs and supports opening each or installing another', () => {
    const { onAdd } = mount({
      installations: [installation('personal', { visibility: 'private' }), installation('family')],
    })
    expect(screen.getByText('Installed · 1 personal, 1 family')).not.toBeNull()
    expect(screen.getByRole('link', { name: 'Open Dinner Spinner' }).getAttribute('href')).toBe(
      '/my-space?view=widgets&widget=personal',
    )
    const dialog = within(detail('Dinner Spinner'))
    expect(dialog.getByRole('link', { name: 'Saved wheel personal' }).getAttribute('href')).toBe(
      '/my-space?view=widgets&widget=personal',
    )
    expect(dialog.getByRole('link', { name: 'Saved wheel family' }).getAttribute('href')).toBe(
      '/my-space?view=family&widget=family',
    )
    fireEvent.click(dialog.getByRole('button', { name: 'Install another Dinner Spinner' }))
    expect(onAdd).toHaveBeenCalledOnce()
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(fetch).not.toHaveBeenCalled()
  })
  it('keeps hidden family installations on an exact spinner route, never defaulting to Shopping', () => {
    mount({ installations: [installation('hidden', { hidden: true })] })
    expect(screen.getByRole('link', { name: 'Open Dinner Spinner' }).getAttribute('href')).toBe(
      '/my-space?view=family&widget=hidden',
    )
    expect(
      within(detail('Dinner Spinner')).getByText('Family · Hidden from your shelf'),
    ).not.toBeNull()
  })
  it.each([
    { loading: true, error: false, row: 'Checking installations…', meta: 'Checking status' },
    {
      loading: false,
      error: true,
      row: 'Installation status unavailable',
      meta: 'Status unavailable',
    },
  ])(
    'distinguishes loading/error availability without enabling Install: $meta',
    ({ loading, error, row, meta }) => {
      const { onAdd } = mount({ loading, error })
      expect(screen.getByText(row)).not.toBeNull()
      expect(screen.queryByText('Available to make your own')).toBeNull()
      const button = screen.getByRole('button', {
        name: 'Install Dinner Spinner',
      }) as HTMLButtonElement
      expect(button.disabled).toBe(true)
      fireEvent.click(button)
      expect(onAdd).not.toHaveBeenCalled()
      const dialog = within(detail('Dinner Spinner'))
      expect(dialog.getByText(meta)).not.toBeNull()
      expect(
        dialog
          .getAllByRole('button', { name: 'Install Dinner Spinner' })
          .every((button) => (button as HTMLButtonElement).disabled),
      ).toBe(true)
    },
  )
  it('combines category/search filtering and recovers an empty result', () => {
    mount()
    fireEvent.click(screen.getByRole('button', { name: 'Games' }))
    expect(screen.getByRole('button', { name: 'About Sudoku' })).not.toBeNull()
    expect(screen.queryByRole('button', { name: /Focus Timer/ })).toBeNull()
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search widgets' }), {
      target: { value: 'Daily' },
    })
    expect(screen.getByRole('button', { name: 'About Daily Word' })).not.toBeNull()
    expect(screen.queryByRole('button', { name: /Sudoku/ })).toBeNull()
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'not-a-widget' } })
    expect(screen.getByText('No matching widgets')).not.toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect((screen.getByRole('searchbox') as HTMLInputElement).value).toBe('')
    expect(screen.getByRole('link', { name: 'Open Shopping List' })).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Discover' }).getAttribute('aria-pressed')).toBe(
      'true',
    )
  })
  it.each(['Countdowns'])('keeps %s proposed with no install action', (name) => {
    const { onAdd } = mount()
    fireEvent.click(screen.getByRole('button', { name: new RegExp(name + '.*Proposed') }))
    const dialog = within(screen.getByRole('dialog', { name: 'Widget Store' }))
    expect(
      dialog.getByText(
        'Proposed app — not available to install or use. These covers illustrate an idea.',
      ),
    ).not.toBeNull()
    expect(dialog.queryByRole('button', { name: /Install/ })).toBeNull()
    expect(dialog.queryByRole('link', { name: /Open/ })).toBeNull()
    expect(onAdd).not.toHaveBeenCalled()
    expect(fetch).not.toHaveBeenCalled()
  })
  it('uses the shared dialog close/Escape lifecycle to restore its opener without losing filters', () => {
    mount()
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Dinner' } })
    const opener = screen.getByRole('button', { name: 'About Dinner Spinner' })
    opener.focus()
    fireEvent.click(opener)
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(opener)
    expect((screen.getByRole('searchbox') as HTMLInputElement).value).toBe('Dinner')
  })
})
