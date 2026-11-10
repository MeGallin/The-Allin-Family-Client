import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import type { RootState } from '../../app/store'
import type { AdminMember, MemberResponse, MemberWrite } from '../../features/members/types'
import { DraftProtectionProvider } from '../../features/drafts/DraftProtection'
import AdminMembers from './AdminMembers'

const fixture = vi.hoisted(() => ({ dispatch: vi.fn(), result: null as MemberResponse | null }))
const dad: AdminMember = {
  id: 1,
  username: 'fixture-dad',
  displayName: 'Fixture Dad',
  nickname: 'Dad',
  familyName: 'Dad',
  role: 'admin',
  profileVersion: 1,
  mustChangePassword: false,
  enabled: true,
  createdAt: '2026-11-10T10:00:00Z',
}
const member: AdminMember = {
  ...dad,
  id: 9001,
  username: 'fixture-member',
  familyName: 'Fixture',
  role: 'member',
}
vi.mock('../../app/store-hooks', () => ({
  useAppDispatch: () => fixture.dispatch,
  useAppSelector: (selector: (state: RootState) => unknown) =>
    selector({
      auth: { user: dad },
      membersUi: { busy: false, error: null },
    } as unknown as RootState),
}))
vi.mock('../../services/members-query', () => ({
  membersApi: {
    useGetAdminMembersQuery: () => ({
      data: { members: [dad, member] },
      isLoading: false,
      refetch: vi.fn(),
    }),
  },
}))
vi.mock('../../features/members/members-actions', () => ({
  executeMemberWrite: (write: MemberWrite) => ({ type: 'fixture-write', write }),
}))
function mount() {
  const router = createMemoryRouter(
    [
      {
        path: '*',
        element: (
          <DraftProtectionProvider>
            <AdminMembers />
          </DraftProtectionProvider>
        ),
      },
    ],
    { initialEntries: ['/admin?view=members'] },
  )
  render(<RouterProvider router={router} />)
}
async function createCredential() {
  fireEvent.click(screen.getByRole('button', { name: 'Add family member' }))
  fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Fixture Member' } })
  fireEvent.change(screen.getByLabelText('Sign-in username'), {
    target: { value: 'fixture-member' },
  })
  fireEvent.submit(screen.getByRole('button', { name: 'Create account' }).closest('form')!)
  await waitFor(() =>
    expect(screen.getByRole('heading', { name: 'Sign-in details for Fixture' })).toBe(
      document.activeElement,
    ),
  )
}
beforeEach(() => {
  fixture.result = { member, self: dad, temporaryPassword: 'synthetic-credential-only' }
  fixture.dispatch.mockImplementation((action) =>
    action.type === 'fixture-write' ? Promise.resolve(fixture.result) : action,
  )
})
describe('one-time credentials remain until explicit acknowledgement', () => {
  it('focuses new credentials once and retains them through Add, Cancel and Edit', async () => {
    mount()
    await createCredential()
    expect((screen.getByLabelText('Temporary password') as HTMLInputElement).value).toBe(
      'synthetic-credential-only',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Add family member' }))
    expect(document.activeElement).toBe(
      screen.getByRole('heading', { name: 'Add a family member' }),
    )
    expect(screen.getByLabelText('Temporary password')).not.toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    fireEvent.click(screen.getByRole('button', { name: 'Edit account for Fixture' }))
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Edit Fixture' }))
    expect((screen.getByLabelText('Temporary password') as HTMLInputElement).value).toBe(
      'synthetic-credential-only',
    )
    fireEvent.click(screen.getByRole('button', { name: 'I’ve saved the details — dismiss' }))
    expect(screen.queryByLabelText('Temporary password')).toBeNull()
    expect(fetch).not.toHaveBeenCalled()
  })
  it('retains earlier credentials when another account produces new details', async () => {
    mount()
    await createCredential()
    fixture.result = {
      member: { ...member, id: 9002, familyName: 'Second fixture' },
      self: dad,
      temporaryPassword: 'second-synthetic-only',
    }
    fireEvent.click(screen.getByRole('button', { name: 'Add family member' }))
    fireEvent.submit(screen.getByRole('button', { name: 'Create account' }).closest('form')!)
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Sign-in details for Second fixture' })).toBe(
        document.activeElement,
      ),
    )
    expect(screen.getAllByLabelText('Temporary password')).toHaveLength(2)
    fireEvent.click(screen.getAllByRole('button', { name: 'I’ve saved the details — dismiss' })[0])
    expect((screen.getByLabelText('Temporary password') as HTMLInputElement).value).toBe(
      'second-synthetic-only',
    )
    expect(fetch).not.toHaveBeenCalled()
  })
  it('replaces a superseded same-account credential while retaining other accounts and focusing the new panel', async () => {
    mount()
    await createCredential()
    fixture.result = {
      member: { ...member, id: 9002, familyName: 'Other fixture' },
      self: dad,
      temporaryPassword: 'other-synthetic-only',
    }
    fireEvent.click(screen.getByRole('button', { name: 'Add family member' }))
    fireEvent.submit(screen.getByRole('button', { name: 'Create account' }).closest('form')!)
    await screen.findByRole('heading', { name: 'Sign-in details for Other fixture' })
    fixture.result = { member, self: dad, temporaryPassword: 'replacement-synthetic-only' }
    fireEvent.click(screen.getByRole('button', { name: 'Edit account for Fixture' }))
    fireEvent.click(screen.getByRole('button', { name: 'Reset password' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirm password reset' }))
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Sign-in details for Fixture' })).toBe(
        document.activeElement,
      ),
    )
    expect(screen.getAllByLabelText('Temporary password')).toHaveLength(2)
    expect(screen.queryByDisplayValue('synthetic-credential-only')).toBeNull()
    expect(screen.getByDisplayValue('replacement-synthetic-only')).not.toBeNull()
    expect(screen.getByDisplayValue('other-synthetic-only')).not.toBeNull()
  })
})
