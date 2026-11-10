import { act, fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import MemoriesPage from './MemoriesPage'
const state = vi.hoisted(() => ({
  memories: [],
  loading: false,
  refreshing: false,
  readError: '',
  error: '',
  feedback: '',
  pending: false,
  refresh: vi.fn(),
  clearError: vi.fn(),
}))
vi.mock('../../features/memories/useMemories', () => ({ useMemories: () => state }))
vi.mock('../../components/family/memories/MemoryActivity', () => ({ MemoryActivity: () => null }))
beforeEach(() => {
  state.error = state.readError = ''
  state.refreshing = false
  state.refresh.mockReset()
})
describe('memory deep-link read failures', () => {
  it.each(['edit', 'remove'])(
    'retains %s link through retry and only describes removal after a successful read',
    async (kind) => {
      state.error = state.readError = 'Synthetic album unavailable'
      const router = createMemoryRouter([{ path: '*', element: <MemoriesPage /> }], {
        initialEntries: ['/memories?' + kind + '=999'],
      })
      render(<RouterProvider router={router} />)
      expect(screen.queryByText(/no longer available/)).toBeNull()
      fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
      expect(state.refresh).toHaveBeenCalledOnce()
      expect(router.state.location.search).toBe('?' + kind + '=999')
      state.refreshing = true
      await act(() => router.navigate(router.state.location))
      expect(
        (screen.getByRole('button', { name: 'Try again' }) as HTMLButtonElement).disabled,
      ).toBe(true)
      state.error = state.readError = ''
      state.refreshing = false
      await act(() => router.navigate(router.state.location))
      expect(screen.getByText(/no longer available/)).toBeTruthy()
    },
  )
})
