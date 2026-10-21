export type FamilyUser = {
  id: number
  username: string
  displayName: string
  nickname: string | null
  familyName: string
  profileVersion: number
  role: 'admin' | 'member'
  mustChangePassword: boolean
}

export type FamilySession = { user: FamilyUser | null; csrfToken: string }
