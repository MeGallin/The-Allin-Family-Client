import { createContext } from 'react'
import type { FamilyUser } from '../../types/auth'
import type {
  EventDraft,
  FamilyEvent,
  FamilyMemory,
  MemoryDraft,
  PollChoice,
  ShoppingItem,
} from './types'

export type FamilyData = {
  user: FamilyUser
  memories: FamilyMemory[]
  events: FamilyEvent[]
  shopping: ShoppingItem[]
  pollChoice: PollChoice | null
  addMemory: (draft: MemoryDraft) => void
  toggleReaction: (id: string) => void
  addEvent: (draft: EventDraft) => void
  addShoppingItem: (title: string) => void
  toggleShoppingItem: (id: string) => void
  removeShoppingItem: (id: string) => void
  vote: (choice: PollChoice) => void
}

export const FamilyDataContext = createContext<FamilyData | null>(null)
