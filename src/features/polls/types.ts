export type PollDraft = {
  title: string
  detail: string
  options: string[]
  closesAt: string
  reopen?: boolean
}
export type FamilyPollRecord = {
  id: string
  title: string
  detail: string
  closesAt: string
  closed: boolean
  version: number
  options: { id: string; label: string; votes: number }[]
  totalVotes: number
  ownOptionId: string | null
  voteVersion: number
  createdBy: { id: number; displayName: string }
  updatedBy: { id: number; displayName: string }
  createdAt: string
  updatedAt: string
}
export type PollSnapshot = { polls: FamilyPollRecord[] }
export type PollWrite = { action: 'add' | 'edit' | 'vote' | 'close' | 'remove'; body: object }
