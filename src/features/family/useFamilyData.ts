import { useAppDispatch, useAppSelector } from '../../app/store-hooks'
import { memoryAdded, eventAdded, reactionToggled, pollChosen } from './family-slice'
import { previewImage } from './preview-images'
import type { EventDraft, MemoryDraft, PollChoice } from './types'

export function useFamilyData() {
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)
  const data = useAppSelector((state) => state.family)
  if (!user) throw new Error('A family session is required')
  return {
    ...data,
    user,
    addMemory: (draft: MemoryDraft) => {
      dispatch(
        memoryAdded({
          id: crypto.randomUUID(),
          title: draft.title,
          caption: draft.caption,
          imageUrl: previewImage(draft.image),
          imageAlt: draft.title,
          author: user.familyName,
          authorId: user.id,
          sample: false,
          reactions: 0,
          liked: false,
        }),
      )
    },
    addEvent: (draft: EventDraft) => {
      dispatch(eventAdded({ ...draft, id: crypto.randomUUID() }))
    },
    toggleReaction: (id: string) => {
      dispatch(reactionToggled(id))
    },
    vote: (choice: PollChoice) => {
      dispatch(pollChosen(choice))
    },
  }
}
