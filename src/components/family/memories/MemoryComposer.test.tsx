import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { DraftProtectionProvider } from '../../../features/drafts/DraftProtection'
import type { FamilyMemory } from '../../../features/memories/types'
import MemoryComposer from './MemoryComposer'
const state = vi.hoisted(() => ({
  add: vi.fn(),
  edit: vi.fn(),
  clearError: vi.fn(),
  memories: [] as FamilyMemory[],
  pending: false,
}))
vi.mock('../../../features/memories/useMemories', () => ({
  useMemories: () => ({ ...state, error: '' }),
}))
const memory: FamilyMemory = {
  id: '91',
  title: 'Saved memory',
  story: 'Saved story',
  photoAlt: 'Saved description',
  photoKey: 'saved-key',
  photoWidth: 1200,
  photoHeight: 800,
  version: 1,
  createdBy: { id: 101, displayName: 'Synthetic owner' },
  updatedBy: { id: 101, displayName: 'Synthetic owner' },
  createdAt: '2026-10-01T12:00:00Z',
  updatedAt: '2026-10-01T12:00:00Z',
  reactions: 0,
  liked: false,
}
function mount(saved?: FamilyMemory) {
  const close = vi.fn()
  const router = createMemoryRouter([
    {
      path: '*',
      element: (
        <DraftProtectionProvider>
          <MemoryComposer memory={saved} onClose={close} />
        </DraftProtectionProvider>
      ),
    },
  ])
  const view = render(<RouterProvider router={router} />)
  return { close, ...view }
}
function select(file: File) {
  const input = screen.getByLabelText(/Choose a photo|Replace the photo/) as HTMLInputElement
  // jsdom cannot populate FileList/value as a native picker does. Supply its selection and a clearable native value.
  Object.defineProperty(input, 'value', {
    configurable: true,
    writable: true,
    value: 'C:\\fakepath\\photo.png',
  })
  fireEvent.change(input, { target: { files: [file] } })
  return input
}
beforeEach(() => {
  state.add.mockReset().mockResolvedValue(true)
  state.edit.mockReset().mockResolvedValue(true)
  state.pending = false
  state.memories = [memory]
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:synthetic-photo')
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
})
describe('clearing selected memory photos', () => {
  it('clears the file and URL, retains the draft and allows the same file again before story-only submission', async () => {
    const { close } = mount()
    fireEvent.change(screen.getByLabelText('Give it a title'), { target: { value: 'Draft title' } })
    fireEvent.change(screen.getByLabelText(/Your story/), { target: { value: 'Draft story' } })
    const file = new File(['synthetic image'], 'photo.png', { type: 'image/png' })
    const input = select(file)
    fireEvent.change(screen.getByLabelText(/Photo description/), {
      target: { value: 'Draft description' },
    })
    expect(screen.getByRole('img').getAttribute('src')).toBe('blob:synthetic-photo')
    fireEvent.click(screen.getByRole('button', { name: 'Clear selected photo' }))
    expect(input.value).toBe('')
    expect(document.activeElement).toBe(input)
    expect(screen.queryByRole('img')).toBeNull()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:synthetic-photo')
    expect((screen.getByLabelText('Give it a title') as HTMLInputElement).value).toBe('Draft title')
    expect((screen.getByLabelText(/Your story/) as HTMLTextAreaElement).value).toBe('Draft story')
    select(file)
    expect(URL.createObjectURL).toHaveBeenCalledTimes(2)
    expect((screen.getByLabelText(/Photo description/) as HTMLInputElement).value).toBe(
      'Draft description',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Clear selected photo' }))
    fireEvent.click(screen.getByRole('button', { name: 'Share memory' }))
    await waitFor(() => expect(close).toHaveBeenCalledOnce())
    expect(state.add).toHaveBeenCalledWith(
      {
        title: 'Draft title',
        story: 'Draft story',
        photoAlt: 'Draft description',
        removePhoto: false,
      },
      expect.any(String),
      undefined,
    )
    expect(fetch).not.toHaveBeenCalled()
  })
  it('clearing a replacement restores the saved photo and never schedules its removal', async () => {
    mount(memory)
    const savedSrc = screen.getByRole('img').getAttribute('src')
    select(new File(['replacement'], 'photo.png', { type: 'image/png' }))
    fireEvent.click(screen.getByRole('button', { name: 'Clear selected photo' }))
    expect(screen.getByRole('img').getAttribute('src')).toBe(savedSrc)
    expect(
      (screen.getByRole('checkbox', { name: 'Remove the current photo' }) as HTMLInputElement)
        .checked,
    ).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    await waitFor(() =>
      expect(state.edit).toHaveBeenCalledWith(
        memory,
        expect.objectContaining({ removePhoto: false }),
        undefined,
      ),
    )
  })
  it('still supports explicit saved-photo removal and releases a pending replacement on unmount', () => {
    const view = mount(memory)
    const file = new File(['replacement'], 'photo.png', { type: 'image/png' })
    const input = select(file)
    fireEvent.click(screen.getByRole('checkbox', { name: 'Remove the current photo' }))
    expect(input.value).toBe('')
    expect(screen.queryByRole('img')).toBeNull()
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1)
    select(file)
    expect(
      (screen.getByRole('checkbox', { name: 'Remove the current photo' }) as HTMLInputElement)
        .checked,
    ).toBe(false)
    view.unmount()
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2)
  })
})
