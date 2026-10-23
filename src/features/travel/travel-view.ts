import type { TravelDayView, TravelFeed, TravelNotice, TravelSnapshot } from './types'

const ukDay = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/London',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})
function dayKey(value: number) {
  const parts = ukDay.formatToParts(value)
  return ['year', 'month', 'day']
    .map((type) => parts.find((part) => part.type === type)?.value)
    .join('-')
}
function feedState(
  feed: TravelFeed | undefined,
  error: boolean,
  now: number,
  maxAge: number,
  delay: number,
) {
  const age = now - Date.parse(feed?.updatedAt ?? '')
  const freshEnough = Number.isFinite(age) && age >= -30000 && age <= maxAge
  return {
    notices: freshEnough
      ? (feed?.data ?? []).filter((n) => n.endsAt === null || Date.parse(n.endsAt) > now)
      : [],
    unavailable: !freshEnough || feed?.status === 'unavailable',
    stale: freshEnough && (error || feed?.status === 'stale' || age > delay),
  }
}

/** Prepare dates once per snapshot, rather than repeating timezone work for up to 360 tiles. */
export function prepareTravelView(
  snapshot: TravelSnapshot | undefined,
  error: boolean,
  now: number,
) {
  const configured = !!snapshot?.lines.length
  const today = dayKey(now)
  const live = feedState(snapshot?.live, error, now, 90000, 60000)
  const planned = feedState(snapshot?.planned, error, now, 3600000, 2100000)
  const dated = planned.notices.flatMap((notice) =>
    notice.planned && notice.startsAt && notice.endsAt
      ? [
          {
            notice,
            from: dayKey(Date.parse(notice.startsAt)),
            through: dayKey(Date.parse(notice.endsAt) - 1),
          },
        ]
      : [],
  )
  // Live incidents belong to today only; future badges require a dated planned-work interval.
  return (day: string): TravelDayView => {
    const notices: TravelNotice[] = []
    const unique = new Set<string>()
    for (const notice of [
      ...(day === today ? live.notices : []),
      ...dated.filter((n) => n.from <= day && n.through >= day).map((n) => n.notice),
    ]) {
      const key = JSON.stringify([notice.lineId, notice.description, notice.status])
      if (!unique.has(key)) {
        unique.add(key)
        notices.push(notice)
      }
    }
    return {
      notices: configured ? notices : [],
      configured,
      unavailable:
        configured &&
        (day === today ? live.unavailable || planned.unavailable : planned.unavailable),
      stale: configured && (day === today ? live.stale || planned.stale : planned.stale),
      liveUpdatedAt: day === today ? (snapshot?.live.updatedAt ?? null) : null,
      plannedUpdatedAt: snapshot?.planned.updatedAt ?? null,
    }
  }
}
