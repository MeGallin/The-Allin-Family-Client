export type FamilyUser = {
  id: number
  username: string
  displayName: string
  role: 'admin' | 'member'
  mustChangePassword: boolean
}

export type FamilySession = { user: FamilyUser | null; csrfToken: string }
