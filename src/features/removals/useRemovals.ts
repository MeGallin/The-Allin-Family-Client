import { useAppDispatch, useAppSelector, useAppStore } from '../../app/store-hooks'
import { removalAdapters } from './removal-adapters'
import {
  removalScheduled,
  removalUndone,
  REMOVAL_DELAY_MS,
  type RemovalDomain,
  type RemovalRecord,
} from './removals-slice'
export function useRemovals(domain: RemovalDomain) {
  const dispatch = useAppDispatch()
  const store = useAppStore()
  const state = useAppSelector((state) => state.removals)
  const auth = useAppSelector((state) => state.auth)
  const entries = Object.values(state.entries).filter(
    (entry) =>
      entry.domain === domain &&
      entry.ownerId === auth.user?.id &&
      entry.generation === auth.generation,
  )
  return {
    removals: Object.fromEntries(entries.map((entry) => [entry.item.id, entry])),
    remove: (record: RemovalRecord): boolean => {
      const state = store.getState()
      const { user, generation } = state.auth
      const key = domain + ':' + record.id
      if (!user || removalAdapters[domain].busy(state)) return false
      if (state.removals.entries[key]) return true
      // Never retain note text or photo data in the delete queue.
      const item = { id: record.id, title: record.title, version: record.version }
      dispatch(
        removalScheduled({
          key,
          domain,
          item,
          token: crypto.randomUUID(),
          deadline: Date.now() + REMOVAL_DELAY_MS,
          sending: false,
          ownerId: user.id,
          generation,
        }),
      )
      return true
    },
    undoRemove: (id: string) => dispatch(removalUndone(domain + ':' + id)),
  }
}
