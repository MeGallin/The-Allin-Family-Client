import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LoginForm } from './LoginForm'

const auth = vi.hoisted(() => ({ signIn: vi.fn(), getSession: vi.fn() }))
vi.mock('../../services/auth-api', () => auth)

beforeEach(() => vi.resetAllMocks())

describe('family sign-in', () => {
  it('shows and hides the same typed password without submitting the form', () => {
    render(<LoginForm onSession={vi.fn()} />)
    const password = screen.getByLabelText('Password') as HTMLInputElement
    fireEvent.change(password, { target: { value: 'Visibility-check-123' } })
    expect(password.type).toBe('password')
    fireEvent.click(screen.getByRole('button', { name: 'Show password' }))
    expect(password.type).toBe('text')
    expect(password.value).toBe('Visibility-check-123')
    fireEvent.click(screen.getByRole('button', { name: 'Hide password' }))
    expect(password.type).toBe('password')
    expect(password.value).toBe('Visibility-check-123')
    expect(auth.signIn).not.toHaveBeenCalled()
  })

  it('shows one wordmark, labelled required fields and quiet account guidance', () => {
    render(<LoginForm onSession={vi.fn()} />)
    expect(screen.getAllByRole('img', { name: 'The Allin Family' })).toHaveLength(1)
    const username = screen.getByLabelText('Username') as HTMLInputElement
    const password = screen.getByLabelText('Password') as HTMLInputElement
    expect(username.required).toBe(true)
    expect(password.required).toBe(true)
    expect(username.autocomplete).toBe('username')
    expect(password.autocomplete).toBe('current-password')
    expect(screen.getByText('Need an account? Ask your family administrator.').className).toBe(
      'login-note',
    )
  })

  it('submits once, shows progress, clears the password and accepts the session', async () => {
    let complete!: (value: object) => void
    auth.signIn.mockReturnValue(
      new Promise((resolve) => {
        complete = resolve
      }),
    )
    const onSession = vi.fn()
    render(<LoginForm onSession={onSession} />)
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'Gary' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'local-test-only' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(
      (screen.getByRole('button', { name: 'Signing in…' }) as HTMLButtonElement).disabled,
    ).toBe(true)
    expect(auth.signIn).toHaveBeenCalledExactlyOnceWith('Gary', 'local-test-only')
    const session = { user: { id: 1, familyName: 'Dad' } }
    complete(session)
    await waitFor(() => expect(onSession).toHaveBeenCalledWith(session))
    expect((screen.getByLabelText('Password') as HTMLInputElement).value).toBe('')
  })

  it('shows a failed sign-in as an alert and permits retry', async () => {
    auth.signIn.mockRejectedValue(new Error('The username or password is incorrect.'))
    const onSession = vi.fn()
    render(<LoginForm onSession={onSession} />)
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'Gary' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect((await screen.findByRole('alert')).textContent).toBe(
      'The username or password is incorrect.',
    )
    expect((screen.getByRole('button', { name: 'Sign in' }) as HTMLButtonElement).disabled).toBe(
      false,
    )
    expect(onSession).not.toHaveBeenCalled()
  })
})
