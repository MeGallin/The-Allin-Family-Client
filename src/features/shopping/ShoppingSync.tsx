import { useLiveQueryOptions } from '../../hooks/useLiveQueryOptions'
import { useEffect, type ReactNode } from 'react'
import { shoppingApi } from '../../services/shopping-query'
import { useShopping } from './useShopping'
import { useAppDispatch } from '../../app/store-hooks'
import { waitingRemovalsCancelled } from '../removals/removals-slice'
import { useProfileSync } from '../auth/useProfileSync'
export function ShoppingSync({
  children,
  onSessionExpired,
}: {
  children: ReactNode
  onSessionExpired: () => void
}) {
  const { failure, pending } = useShopping()
  useProfileSync(onSessionExpired)
  const dispatch = useAppDispatch()
  useEffect(
    () => () => {
      dispatch(waitingRemovalsCancelled())
    },
    [dispatch],
  )
  shoppingApi.useGetShoppingQuery(undefined, useLiveQueryOptions('/lists', pending))
  useEffect(() => {
    if (failure?.status === 401 || failure?.code === 'password_change_required') onSessionExpired()
  }, [failure?.status, failure?.code, onSessionExpired])
  return children
}
