import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { FamilyUser } from '../../types/auth'
import { FamilyDataContext } from './FamilyDataContext'
import { createSampleFamilyData } from './data/sample-family'
import type { EventDraft, MemoryDraft, PollChoice } from './types'

export function FamilyDataProvider({ user, children }: { user: FamilyUser; children: ReactNode }) {
  const [data, setData] = useState(createSampleFamilyData)
  const [pollChoice, setPollChoice] = useState<PollChoice | null>(null)
  const imageUrls = useRef(new Set<string>())

  useEffect(
    () => () => {
      imageUrls.current.forEach((url) => URL.revokeObjectURL(url))
      imageUrls.current.clear()
    },
    [],
  )

  function addMemory(draft: MemoryDraft) {
    const id = crypto.randomUUID()
    const imageUrl = URL.createObjectURL(draft.image)
    imageUrls.current.add(imageUrl)
    setData((current) => ({
      ...current,
      memories: [
        {
          id,
          title: draft.title,
          caption: draft.caption,
          imageUrl,
          imageAlt: draft.title,
          author: user.displayName,
          sample: false,
          reactions: 0,
          liked: false,
        },
        ...current.memories,
      ],
    }))
  }

  function addEvent(draft: EventDraft) {
    const id = crypto.randomUUID()
    setData((current) => ({ ...current, events: [...current.events, { ...draft, id }] }))
  }

  return (
    <FamilyDataContext.Provider
      value={{
        user,
        ...data,
        pollChoice,
        addMemory,
        addEvent,
        toggleReaction: (id) =>
          setData((current) => ({
            ...current,
            memories: current.memories.map((memory) =>
              memory.id === id
                ? {
                    ...memory,
                    liked: !memory.liked,
                    reactions: memory.reactions + (memory.liked ? -1 : 1),
                  }
                : memory,
            ),
          })),
        addShoppingItem: (title) => {
          const trimmed = title.trim()
          if (!trimmed) return
          const id = crypto.randomUUID()
          setData((current) => ({
            ...current,
            shopping: [...current.shopping, { id, title: trimmed, checked: false }],
          }))
        },
        toggleShoppingItem: (id) =>
          setData((current) => ({
            ...current,
            shopping: current.shopping.map((item) =>
              item.id === id ? { ...item, checked: !item.checked } : item,
            ),
          })),
        removeShoppingItem: (id) =>
          setData((current) => ({
            ...current,
            shopping: current.shopping.filter((item) => item.id !== id),
          })),
        vote: setPollChoice,
      }}
    >
      {children}
    </FamilyDataContext.Provider>
  )
}
