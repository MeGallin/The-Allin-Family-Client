import { useContext } from 'react'
import { FamilyDataContext } from './FamilyDataContext'

export function useFamilyData() {
  const context = useContext(FamilyDataContext)
  if (!context) throw new Error('Family data must be used within its provider.')
  return context
}
