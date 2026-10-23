import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { FamilyMemory } from '../../../features/memories/types'
import { MemoryPhoto } from './MemoryPhoto'

const memory: FamilyMemory = {
  id: '3',
  title: 'By the sea',
  story: '',
  photoWidth: 2400,
  photoHeight: 3200,
  photoKey: 'photo-key',
  photoAlt: 'A family day by the sea',
  version: 1,
  createdBy: { id: 1, displayName: 'Dad' },
  updatedBy: { id: 1, displayName: 'Dad' },
  createdAt: '2026-10-22T12:00:00Z',
  updatedAt: '2026-10-22T12:00:00Z',
  reactions: 0,
  liked: false,
}

describe('enlarged memory photos', () => {
  it('opens on demand, zooms, fits, closes and restores focus without a write', async () => {
    render(<MemoryPhoto memory={memory} />)
    expect(screen.queryByRole('dialog')).toBeNull()
    const trigger = screen.getByRole('button', { name: 'Enlarge photo: By the sea' })
    trigger.focus()
    fireEvent.click(trigger)
    const dialog = await screen.findByRole('dialog', { name: 'By the sea' })
    const canvas = within(dialog).getByRole('region', { name: 'Enlarged photo' })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Zoom in' }))
    expect(canvas.classList.contains('is-zoomed')).toBe(true)
    fireEvent.click(within(dialog).getByRole('button', { name: 'Fit photo' }))
    expect(canvas.classList.contains('is-zoomed')).toBe(false)
    const original = within(dialog).getByRole('link', { name: /Open original/ })
    expect(original.getAttribute('href')).toBe('/api/memories/photo?id=3&v=photo-key')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(trigger)
    expect(fetch).not.toHaveBeenCalled()
  })
  it('handles image failure and dialog cancellation', async () => {
    render(<MemoryPhoto memory={memory} />)
    fireEvent.click(screen.getByRole('button', { name: 'Enlarge photo: By the sea' }))
    const dialog = await screen.findByRole('dialog', { name: 'By the sea' })
    fireEvent.error(within(dialog).getByRole('img', { name: memory.photoAlt }))
    expect(within(dialog).getByText('Photo could not be loaded')).toBeTruthy()
    fireEvent(dialog, new Event('cancel', { bubbles: true, cancelable: true }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })
})
