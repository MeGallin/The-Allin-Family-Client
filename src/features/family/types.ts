export type FamilyMemory = {
  id: string
  title: string
  caption: string
  imageUrl: string
  imageAlt: string
  author: string
  authorId?: number
  sample: boolean
  reactions: number
  liked: boolean
}

export type FamilyEvent = {
  id: string
  title: string
  startsAt: string
  detail: string
}

export type PollChoice = 'Picnic' | 'Games night'
export type MemoryDraft = { title: string; caption: string; image: File }
export type EventDraft = Omit<FamilyEvent, 'id'>
export type Composer = 'memory' | 'event'
