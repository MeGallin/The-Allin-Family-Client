import { travelApi } from '../../services/travel-query'

export function useTravel() {
  return travelApi.useGetTravelQuery(undefined, {
    pollingInterval: 30000,
    skipPollingIfUnfocused: true,
    refetchOnMountOrArgChange: 30,
  })
}
