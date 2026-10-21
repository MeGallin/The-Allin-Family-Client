import type { FamilyUser } from '../../types/auth'
export type AdminMember = FamilyUser & { enabled: boolean; createdAt: string }
export type MemberDraft = {
  username: string
  displayName: string
  nickname: string
  role: FamilyUser['role']
  enabled: boolean
}
export type MemberWrite =
  | { action: 'add'; body: MemberDraft }
  | { action: 'edit'; body: MemberDraft & { id: number; version: number } }
  | { action: 'password'; body: { id: number; version: number } }
export type MemberResponse = {
  member: AdminMember
  self: FamilyUser
  temporaryPassword: string | null
}
