import { weekContextApi } from '../../services/week-context-query'

/** Subscribe only in views showing forecasts or their settings; share the query cache. */
export function useWeekContext() {
  return weekContextApi.useGetWeekContextQuery(undefined, {
    pollingInterval: 30 * 60 * 1000,
    skipPollingIfUnfocused: true,
    refetchOnMountOrArgChange: 1800,
  })
}
