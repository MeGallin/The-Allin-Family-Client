import { useAppDispatch, useAppSelector } from '../../app/store-hooks'
import { pollChosen } from './family-slice'
import type { PollChoice } from './types'

export function useFamilyData() {
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)
  const data = useAppSelector((state) => state.family)
  if (!user) throw new Error('A family session is required')
  return {
    ...data,
    user,
    vote: (choice: PollChoice) => {
      dispatch(pollChosen(choice))
    },
  }
}
