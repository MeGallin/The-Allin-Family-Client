import type { FeedStatus } from '../week-context/types'

export type TravelLine = { id: string; name: string; group: string }
export type TravelPreferences = { lines: string[]; version: number; availableLines: TravelLine[] }
export type TravelNotice = {
  id: string
  lineId: string
  line: string
  status: string
  severity: number
  description: string
  advice: string
  planned: boolean
  startsAt: string | null
  endsAt: string | null
}
export type TravelFeed = {
  status: FeedStatus
  updatedAt: string | null
  data: TravelNotice[] | null
}
export type TravelSnapshot = {
  lines: string[]
  live: TravelFeed
  planned: TravelFeed
  through: string
}
export type TravelDayView = {
  notices: TravelNotice[]
  configured: boolean
  unavailable: boolean
  stale: boolean
  liveUpdatedAt: string | null
  plannedUpdatedAt: string | null
}
