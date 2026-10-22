import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PasswordInput } from './PasswordInput'

describe('password visibility input', () => {
  it('starts masked and connects its toggle to the input', () => {
    render(<PasswordInput id="example-password" aria-label="Password" />)
    const input = screen.getByLabelText('Password') as HTMLInputElement
    const toggle = screen.getByRole('button', { name: 'Show password' })
    expect(input.type).toBe('password')
    expect(toggle.getAttribute('aria-controls')).toBe(input.id)
    expect(toggle.getAttribute('type')).toBe('button')
    expect(input.getAttribute('spellcheck')).toBe('false')
  })

  it('does not clear an uncontrolled value when toggled repeatedly', () => {
    render(<PasswordInput id="example-password" aria-label="Password" defaultValue="sample-only" />)
    const input = screen.getByLabelText('Password') as HTMLInputElement
    for (let cycle = 0; cycle < 3; cycle++) {
      fireEvent.click(screen.getByRole('button', { name: 'Show password' }))
      expect(input.type).toBe('text')
      expect(input.value).toBe('sample-only')
      fireEvent.click(screen.getByRole('button', { name: 'Hide password' }))
      expect(input.type).toBe('password')
      expect(input.value).toBe('sample-only')
    }
  })

  it('disables the input and toggle together', () => {
    render(<PasswordInput id="example-password" aria-label="Password" disabled />)
    expect((screen.getByLabelText('Password') as HTMLInputElement).disabled).toBe(true)
    expect(
      (screen.getByRole('button', { name: 'Show password' }) as HTMLButtonElement).disabled,
    ).toBe(true)
  })
})
