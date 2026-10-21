import { useEffect, type ReactNode } from 'react'
import { useAppDispatch } from '../../app/store-hooks'
import { familyReset } from './family-slice'
import { releasePreviewImages } from './preview-images'
export function FamilyStateLifetime({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch()
  useEffect(
    () => () => {
      releasePreviewImages()
      dispatch(familyReset())
    },
    [dispatch],
  )
  return children
}
