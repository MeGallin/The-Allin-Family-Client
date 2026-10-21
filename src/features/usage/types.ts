export type UsagePerson = {
  id: number
  name: string
  username: string
  enabled: boolean
  logins: number
  activeSeconds: number
  usedInPeriod: boolean
  lastLoginAt: string | null
  lastSeenAt: string | null
}
export type UsageSession = {
  id: string
  userId: number
  name: string
  startedAt: string
  loginAt: string | null
  lastSeenAt: string
  lastPage: string
  activeSeconds: number
  endedAt: string | null
  status: 'active' | 'recent' | 'inactive' | 'logout' | 'expired' | 'revoked' | 'replaced'
}
export type UsageFilters = { days: string; user: string; before: string }
export type UsageSnapshot = {
  people: UsagePerson[]
  sessions: UsageSession[]
  nextCursor: string | null
  generatedAt: string
}
