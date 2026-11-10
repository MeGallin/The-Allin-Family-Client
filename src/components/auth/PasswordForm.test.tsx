import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PasswordForm } from './PasswordForm'

describe('password change assistance', () => {
  it('names each visibility toggle and focuses associated confirmation mismatch without sending a request', () => {
    render(<PasswordForm required={false} onSession={vi.fn()} onCancel={vi.fn()} />)
    const current = screen.getByLabelText('Current password') as HTMLInputElement
    const next = screen.getByLabelText('New password') as HTMLInputElement
    const confirmation = screen.getByLabelText('Confirm new password') as HTMLInputElement
    fireEvent.change(current, { target: { value: 'Synthetic current phrase' } })
    fireEvent.change(next, { target: { value: 'Synthetic new phrase' } })
    fireEvent.change(confirmation, { target: { value: 'Synthetic wrong phrase' } })
    for (const label of ['current password', 'new password', 'password confirmation']) {
      fireEvent.click(screen.getByRole('button', { name: 'Show ' + label }))
      expect(screen.getByRole('button', { name: 'Hide ' + label })).toBeTruthy()
    }
    fireEvent.click(screen.getByRole('button', { name: 'Save password' }))
    expect(document.activeElement).toBe(confirmation)
    expect(confirmation.getAttribute('aria-invalid')).toBe('true')
    expect(
      document.getElementById(confirmation.getAttribute('aria-describedby')!)?.textContent,
    ).toBe('The new passwords do not match.')
    expect(current.value).toBe('Synthetic current phrase')
    expect(next.value).toBe('Synthetic new phrase')
    expect(fetch).not.toHaveBeenCalled()
    fireEvent.change(confirmation, { target: { value: next.value } })
    expect(confirmation.hasAttribute('aria-invalid')).toBe(false)
    expect(screen.queryByRole('alert')).toBeNull()
    expect(current.autocomplete).toBe('current-password')
    expect(next.autocomplete).toBe('new-password')
  })
})
