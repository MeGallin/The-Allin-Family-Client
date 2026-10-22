export type FeedStatus = 'ready' | 'stale' | 'unavailable' | 'unconfigured'
export type WeatherDay = { date: string; code: number; high: number; low: number; rain: number }
type Feed<T> = { status: FeedStatus; updatedAt: string | null; data: T[] | null }
export type WeekContext = {
  weather: Feed<WeatherDay> & { location: string; timeZone: string }
  holidays: Feed<{ date: string; title: string }> & { region: string }
}
export type WeekTown = { id: number; label: string; timeZone: string }
export type TownChoice = WeekTown & { token: string }
export type WeekPreferences = { town: WeekTown | null; region: string; version: number }
export type WeekPreferenceChange = { version: number; region: string; townToken?: string | null }
