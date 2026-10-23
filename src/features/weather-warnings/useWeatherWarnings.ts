import { weekContextApi } from '../../services/week-context-query'

export function useWeatherWarnings() {
  return weekContextApi.useGetWeatherWarningsQuery(undefined, {
    pollingInterval: 5 * 60 * 1000,
    skipPollingIfUnfocused: true,
    refetchOnMountOrArgChange: 300,
  })
}
