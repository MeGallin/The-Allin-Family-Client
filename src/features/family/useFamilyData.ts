import { useAppSelector } from '../../app/store-hooks'
export function useFamilyData() {
  const user = useAppSelector((state) => state.auth.user)
  if (!user) throw new Error('A family session is required')
  return { user }
}
