import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { DraftProtectionProvider } from '../../features/drafts/DraftProtection'
import type { useWhereItems } from '../../features/where-is-it/useWhereItems'
import { WhereItemForm } from './WhereItemForm'

type Controller = ReturnType<typeof useWhereItems>
const slot = vi.hoisted(() => ({ current: null as unknown as Controller }))
vi.mock('../../features/where-is-it/useWhereItems', () => ({ useWhereItems: () => slot.current }))

function mount(status = 502) {
  const save = vi.fn(async () => false)
  const onClose = vi.fn()
  slot.current = {
    items: [],
    loading: false,
    known: true,
    pending: false,
    offline: false,
    failure: undefined,
    error: '',
    clearError: vi.fn(),
    refresh: vi.fn(),
    save,
    lastFailure: () => ({ status, code: '', message: 'Save response unavailable' }),
    removals: {},
    remove: vi.fn(),
    undoRemove: vi.fn(),
  } as unknown as Controller
  render(
    <RouterProvider
      router={createMemoryRouter([
        {
          path: '*',
          element: (
            <DraftProtectionProvider>
              <WhereItemForm widgetId="6" locations={['Hall cupboard']} onClose={onClose} />
            </DraftProtectionProvider>
          ),
        },
      ])}
    />,
  )
  return { save, onClose }
}
const name = () => screen.getByRole('textbox', { name: /Item name/ }) as HTMLInputElement
const location = () => screen.getByRole('combobox', { name: /Location/ }) as HTMLInputElement

describe('Where item draft and save recovery', () => {
  it('keeps 5xx uncertain attempts immutable and retries exactly the same request', async () => {
    const { save, onClose } = mount()
    fireEvent.change(name(), { target: { value: 'Travel adapter' } })
    fireEvent.change(location(), { target: { value: 'Hall cupboard' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save item' }))
    await screen.findByRole('button', { name: 'Retry this save' })
    expect(name().disabled || name().closest('fieldset')?.disabled).toBe(true)
    const first = save.mock.calls[0]
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Retry this save' }))
    })
    expect(save.mock.calls[1]).toEqual(first)
    expect(onClose).not.toHaveBeenCalled()
    expect(name().value).toBe('Travel adapter')
  })
  it('shows inline required errors and guards cancelling a changed draft', async () => {
    const { save, onClose } = mount(422)
    fireEvent.click(screen.getByRole('button', { name: 'Save item' }))
    expect(await screen.findByText('Enter an item name.')).not.toBeNull()
    expect(save).not.toHaveBeenCalled()
    fireEvent.change(name(), { target: { value: 'Adapter' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(await screen.findByRole('dialog', { name: 'Discard unsaved changes?' })).not.toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }))
    await waitFor(() => expect(name().value).toBe('Adapter'))
    expect(onClose).not.toHaveBeenCalled()
  })
  it('keeps a rejected validation draft editable for correction', async () => {
    mount(422)
    fireEvent.change(name(), { target: { value: 'Adapter' } })
    fireEvent.change(location(), { target: { value: 'Hall' } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save item' }))
    })
    expect(screen.queryByRole('button', { name: 'Retry this save' })).toBeNull()
    expect(name().closest('fieldset')?.disabled).toBe(false)
    expect(name().value).toBe('Adapter')
  })
})
