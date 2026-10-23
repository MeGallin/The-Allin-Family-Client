import { foodAlertsApi } from '../../services/food-alerts-query'

export function useFoodAlerts() {
  return foodAlertsApi.useGetFoodAlertsQuery(undefined, {
    pollingInterval: 30 * 60 * 1000,
    skipPollingIfUnfocused: true,
    refetchOnMountOrArgChange: 1800,
  })
}
