import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { TravelPreferencesForm } from './TravelPreferencesForm'

const state = vi.hoisted(() => ({
  preferences: {
    lines: [] as string[],
    version: 0,
    availableLines: [{ id: 'central', name: 'Central', group: 'Tube' }],
  },
  mutation: { isLoading: false, error: undefined, reset: vi.fn() },
  save: vi.fn(),
}))
vi.mock('../../services/travel-query', () => ({
  travelApi: {
    useGetTravelPreferencesQuery: () => ({
      data: state.preferences,
      isLoading: false,
      isError: false,
    }),
    useSaveTravelPreferencesMutation: () => [state.save, state.mutation],
  },
}))
vi.mock('../../features/drafts/DraftProtection', () => ({
  useDraftGuard: () => ({
    complete: (action: () => void) => action(),
    close: (action: () => void) => action(),
  }),
}))

beforeEach(() => {
  state.preferences = {
    lines: [],
    version: 0,
    availableLines: [{ id: 'central', name: 'Central', group: 'Tube' }],
  }
  state.mutation.isLoading = false
  state.save.mockReset()
})

it('selects and clears all lines, and exposes a mixed state for a partial choice', () => {
  state.preferences.availableLines.push({ id: 'dlr', name: 'DLR', group: 'Other TfL rail' })
  render(<TravelPreferencesForm />)
  const all = screen.getByRole('checkbox', { name: 'Select all lines' }) as HTMLInputElement
  const central = screen.getByRole('checkbox', { name: 'Central' }) as HTMLInputElement
  const dlr = screen.getByRole('checkbox', { name: 'DLR' }) as HTMLInputElement
  fireEvent.click(central)
  expect(all.checked).toBe(false)
  expect(all.indeterminate).toBe(true)
  fireEvent.click(all)
  expect(central.checked).toBe(true)
  expect(dlr.checked).toBe(true)
  expect(all.indeterminate).toBe(false)
  fireEvent.click(all)
  expect(central.checked).toBe(false)
  expect(dlr.checked).toBe(false)
  expect(state.save).not.toHaveBeenCalled()
})

it('ends the busy state after saving and clearly distinguishes saved and editable choices', async () => {
  let finish!: (value: typeof state.preferences) => void
  const pending = new Promise<typeof state.preferences>((resolve) => {
    finish = resolve
  })
  state.save.mockReturnValue({ unwrap: () => pending })
  const view = render(<TravelPreferencesForm />)
  const initial = screen.getByRole('button', { name: 'Save travel choices' }) as HTMLButtonElement
  expect(initial.disabled).toBe(true)
  expect(initial.getAttribute('aria-busy')).toBe('false')
  fireEvent.click(screen.getByRole('checkbox', { name: 'Central' }))
  fireEvent.click(initial)
  state.mutation.isLoading = true
  view.rerender(<TravelPreferencesForm />)
  expect(screen.getByRole('button', { name: 'Saving…' }).getAttribute('aria-busy')).toBe('true')
  expect(state.save).toHaveBeenCalledWith({ lines: ['central'], version: 0 })
  await act(async () => {
    finish({ ...state.preferences, lines: ['central'], version: 1 })
  })
  state.mutation.isLoading = false
  view.rerender(<TravelPreferencesForm />)
  const saved = screen.getByRole('button', { name: 'Choices saved' }) as HTMLButtonElement
  expect(saved.disabled).toBe(true)
  expect(saved.getAttribute('aria-busy')).toBe('false')
  expect(
    screen.getByText('Saved. Your calendar will show disruptions for these lines.'),
  ).toBeTruthy()
  fireEvent.click(screen.getByRole('checkbox', { name: 'Central' }))
  const editable = screen.getByRole('button', { name: 'Save travel choices' }) as HTMLButtonElement
  expect(editable.disabled).toBe(false)
  expect(editable.getAttribute('aria-busy')).toBe('false')
})
