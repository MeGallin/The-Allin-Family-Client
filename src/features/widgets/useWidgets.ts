import { useOnline } from '../../hooks/useOnline'
import { useAppDispatch, useAppSelector, useAppStore } from '../../app/store-hooks'
import { useLiveQueryOptions } from '../../hooks/useLiveQueryOptions'
import { widgetsApi } from '../../services/widgets-query'
import { shoppingError } from '../../services/shopping-query'
import { useRemovals } from '../removals/useRemovals'
import { executeWidgetWrite } from './widgets-actions'
import type {
  DinnerPublication,
  DinnerResponse,
  FamilyWidget,
  MealType,
  WidgetDraft,
} from './types'
export function useWidgets() {
  const dispatch = useAppDispatch(),
    store = useAppStore()
  const online = useOnline()
  const ownerId = useAppSelector((state) => state.auth.user?.id)
  const ui = useAppSelector((state) => state.widgetsUi)
  const live = useLiveQueryOptions('/my-space', ui.busy)
  const query = widgetsApi.useGetWidgetsQuery(ownerId ?? 0, {
    ...live,
    skip: !ownerId || live.skip,
  })
  const [, mutation] = widgetsApi.useChangeWidgetMutation({ fixedCacheKey: 'widget-write' })
  const removal = useRemovals('widgets'),
    mealRemoval = useRemovals('widgetMeals')
  const failure = shoppingError(mutation.error) ?? shoppingError(query.error)
  const data = query.data?.ownerId === ownerId ? query.data : undefined
  return {
    ownerId,
    widgets: data?.widgets ?? [],
    pending: ui.busy,
    offline: !online,
    feedback: ui.feedback,
    loading: online && !data && (query.isUninitialized || query.isLoading),
    failure,
    error: !online
      ? 'You’re offline. Saved choices stay visible; reconnect before saving or spinning.'
      : (failure?.message ?? ''),
    clearError: mutation.reset,
    refresh: () => {
      mutation.reset()
      if (ownerId)
        void dispatch(
          widgetsApi.endpoints.getWidgets.initiate(ownerId, {
            subscribe: false,
            forceRefetch: true,
          }),
        )
    },
    add: (draft: WidgetDraft, requestKey: string) =>
      dispatch(executeWidgetWrite({ action: 'add', body: { ...draft, requestKey } })),
    edit: (widget: FamilyWidget, draft: WidgetDraft) =>
      dispatch(
        executeWidgetWrite({
          action: 'edit',
          body: { ...draft, id: widget.id, version: widget.version },
        }),
      ),
    spin: async (widget: FamilyWidget, requestKey: string) => {
      const saved = await dispatch(
        executeWidgetWrite({
          action: 'spin',
          body: { id: widget.id, version: widget.version, requestKey },
        }),
      )
      return saved ? store.getState().widgetsUi.selectedSpin : null
    },
    hide: (widget: FamilyWidget, hidden: boolean) =>
      dispatch(executeWidgetWrite({ action: 'hide', body: { id: widget.id, hidden } })),
    publish: (
      widget: FamilyWidget,
      spinId: string,
      forDate: string,
      mealType: MealType,
      previousPublicationId: string | null,
      requestKey: string,
    ) =>
      dispatch(
        executeWidgetWrite({
          action: 'publish',
          body: {
            id: widget.id,
            version: widget.version,
            spinId,
            forDate,
            mealType,
            previousPublicationId,
            requestKey,
          },
        }),
      ),
    recordEaten: (widget: FamilyWidget, publication: DinnerPublication, eaten: boolean) =>
      dispatch(
        executeWidgetWrite({
          action: 'eaten',
          body: { id: widget.id, version: widget.version, publicationId: publication.id, eaten },
        }),
      ),
    respond: (widget: FamilyWidget, publication: DinnerPublication, choice: DinnerResponse) =>
      dispatch(
        executeWidgetWrite({
          action: 'respond',
          body: {
            id: widget.id,
            publicationId: publication.id,
            choice,
            responseVersion:
              publication.members.find((member) => member.id === ownerId)?.version ?? 0,
          },
        }),
      ),
    ...removal,
    mealRemoval,
  }
}
