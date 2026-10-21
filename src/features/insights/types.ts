export type InsightCounts = {
  created: number
  updated: number
  responded: number
  removed: number
  total: number
}
export type InsightPerson = InsightCounts & {
  id: number
  name: string
  enabled: boolean
  logins: number
  activeSeconds: number
}
export type InsightDay = {
  date: string
  total: number | null
  created: number | null
  updated: number | null
  responded: number | null
  removed: number | null
  contributors: number | null
  signins: number | null
}
export type InsightSnapshot = {
  days: number
  timezone: string
  from: string
  through: string
  activitySince: string | null
  usageSince: string | null
  daily: InsightDay[]
  features: (InsightCounts & { key: string })[]
  people: InsightPerson[]
  summary: {
    actions: number
    previousActions: number | null
    contributors: number
    signins: number
  }
  generatedAt: string
}
