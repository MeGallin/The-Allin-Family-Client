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

export type PollChoice = 'Picnic' | 'Games night'
export type MemoryDraft = { title: string; caption: string; image: File }
export type Composer = 'memory' | 'event'
