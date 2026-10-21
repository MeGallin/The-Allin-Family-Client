import type { TooltipContentProps } from 'recharts'
import { StackedActivityChart } from './StackedActivityChart'
import { Link } from 'react-router'
import type { InsightPerson, InsightSnapshot } from '../../../features/insights/types'
import { activitySeries } from '../../../features/insights/chart-config'
import { usageDuration } from '../../../features/usage/usage-format'
import { ActivityLegend, ChartPanel } from './ChartPanel'

function MemberTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload.length) return null
  const person = payload[0].payload as InsightPerson
  return (
    <div className="chart-tooltip">
      <strong>{person.name}</strong>
      <p>
        {person.total} shared actions · {person.logins} sign-ins
      </p>
      <p>{usageDuration(person.activeSeconds)} estimated active time</p>
      {activitySeries.map((series) => (
        <p key={series.key}>
          {series.label}: {person[series.key]}
        </p>
      ))}
    </div>
  )
}
export function MemberParticipation({ data }: { data: InsightSnapshot }) {
  const people = [...data.people].sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))
  return (
    <ChartPanel
      title="Who is taking part?"
      description="Shared contributions alongside sign-ins and active time. Signing in and contributing are different kinds of participation."
    >
      <ActivityLegend />
      <StackedActivityChart
        label="Shared contributions by family member"
        data={people}
        tooltip={MemberTooltip}
        height={Math.max(200, people.length * 46)}
      />
      <ul className="insight-member-list" aria-label="Member participation figures">
        {people.map((person) => (
          <li key={person.id}>
            <Link to={'/admin?view=usage&user=' + person.id + '&days=' + data.days}>
              {person.name}
              {!person.enabled && ' · disabled'}
            </Link>
            <p>
              <strong>{person.total}</strong> actions · <strong>{person.logins}</strong> sign-ins ·{' '}
              {usageDuration(person.activeSeconds)} active
            </p>
          </li>
        ))}
      </ul>
      <p className="note">
        Active time is estimated for sessions started in this period. No recorded activity does not
        prove someone has never used the site.
      </p>
    </ChartPanel>
  )
}
