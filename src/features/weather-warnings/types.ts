import type { FeedStatus } from '../week-context/types'

export type WeatherWarning = {
  id: string
  title: string
  description: string
  level: 'yellow' | 'amber' | 'red'
  weather: string
  region: string
  areas: string[]
  matchedAreas: string[]
  startsAt: string
  endsAt: string
  startsOn: string
  endsOn: string
  url: string
}
export type WeatherWarningsFeed = {
  status: FeedStatus
  updatedAt: string | null
  location: string
  data: WeatherWarning[] | null
}
