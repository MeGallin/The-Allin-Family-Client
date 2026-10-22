type Actor = { id: number; displayName: string }
export type MemoryDraft = { title: string; story: string; photoAlt: string; removePhoto: boolean }
export type FamilyMemory = {
  id: string
  title: string
  story: string
  photoWidth: number | null
  photoHeight: number | null
  photoKey: string | null
  photoAlt: string
  version: number
  createdBy: Actor
  updatedBy: Actor
  createdAt: string
  updatedAt: string
  reactions: number
  liked: boolean
}
export type MemoryActivity = {
  id: string
  memoryId: string
  changes?: { story: boolean; photo: boolean; description: boolean }
  action: 'created' | 'edited' | 'removed' | 'liked' | 'unliked'
  actor: Actor
  occurredAt: string
  before: { title: string; story?: string; photoKey?: string | null } | null
  after: { title: string; story?: string; photoKey?: string | null } | null
}
export type MemorySnapshot = { memories: FamilyMemory[]; activity: MemoryActivity[] }
export type MemoryAction = 'add' | 'edit' | 'remove' | 'react'
