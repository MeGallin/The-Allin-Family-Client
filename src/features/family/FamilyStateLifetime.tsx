import { useEffect, type ReactNode } from 'react'
import { useAppDispatch } from '../../app/store-hooks'
import { familyReset } from './family-slice'
export function FamilyStateLifetime({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch()
  useEffect(
    () => () => {
      dispatch(familyReset())
    },
    [dispatch],
  )
  return children
}
