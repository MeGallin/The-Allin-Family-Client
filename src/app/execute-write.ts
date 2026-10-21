import type { AppDispatch, RootState } from './store'
import {
  shoppingApi,
  shoppingError,
  serializableError,
  type ShoppingError,
} from '../services/shopping-query'
type WritePlan<T> = {
  busy: (state: RootState) => boolean
  start: () => void
  request: () => Promise<T>
  commit: (data: T) => Promise<void>
  refresh: () => Promise<unknown>
  finish: () => void
  failed?: (error: ShoppingError) => void
}
/** One lifecycle for feature writes. Plans supply only domain-specific operations. */
export async function executeWrite<T>(
  dispatch: AppDispatch,
  getState: () => RootState,
  plan: WritePlan<T>,
): Promise<boolean> {
  const { user, generation } = getState().auth
  if (!user || plan.busy(getState())) return false
  const current = () => generation === getState().auth.generation
  plan.start()
  try {
    const data = await plan.request()
    if (!current()) return false
    await plan.commit(data)
    if (current()) dispatch(shoppingApi.util.invalidateTags(['AdminActivity', 'AdminInsights']))
    return current()
  } catch (error) {
    if (!current()) return false
    const failure = shoppingError(error) ?? serializableError(error)
    plan.failed?.(failure)
    if ([404, 409].includes(failure.status)) await plan.refresh()
    return false
  } finally {
    if (current()) plan.finish()
  }
}
