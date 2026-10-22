import { useLiveQueryOptions } from '../../hooks/useLiveQueryOptions'
import { useEffect } from 'react'
import { useAppDispatch } from '../../app/store-hooks'
import { profileApi } from '../../services/profile-query'
import { shoppingError } from '../../services/shopping-query'
import { userReceived } from './auth-slice'
export function useProfileSync(onSessionExpired: () => void) {
  const dispatch = useAppDispatch()
  const { data, error } = profileApi.useGetProfileQuery(
    undefined,
    useLiveQueryOptions('/profile', false, true),
  )
  const failure = shoppingError(error)
  useEffect(() => {
    if (data) dispatch(userReceived(data.profile))
  }, [data, dispatch])
  useEffect(() => {
    if (failure?.status === 401 || failure?.code === 'password_change_required') onSessionExpired()
  }, [failure?.status, failure?.code, onSessionExpired])
}
