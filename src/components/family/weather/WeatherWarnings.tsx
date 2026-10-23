import { ArrowUpRight, TriangleAlert, CloudAlert } from 'lucide-react'
import type { CalendarWeatherWarningsProps } from '../home/CalendarWeatherWarnings'
import { warningTime } from '../../../features/weather-warnings/warning-view'
import { Accordion } from '../../ui/Accordion'
import { AlertSource, AlertSummary } from '../../ui/AlertBriefing'
import { FriendlyTime } from '../../ui/FriendlyTime'
import { Icon } from '../../ui/Icon'
import './WeatherWarnings.css'

export default function WeatherWarnings({
  warnings,
  location,
  updatedAt,
  stale,
}: CalendarWeatherWarningsProps) {
  return (
    <section className="weather-warnings" aria-label="Met Office warnings">
      <AlertSource
        provider="Met Office"
        description={location}
        icon={CloudAlert}
        href="https://www.metoffice.gov.uk/weather/warnings-and-advice/uk-warnings"
        linkLabel="View warning map"
      />
      {stale && (
        <p className="weather-warnings__status" role="status">
          Updates are delayed. These are saved notices; check the Met Office for the latest warning.
        </p>
      )}
      <Accordion
        itemClassName="weather-warning alert-briefing__item"
        summaryClassName="weather-warning__summary alert-briefing__summary"
        items={warnings.map((warning) => ({
          id: warning.id,
          title: (
            <AlertSummary
              icon={TriangleAlert}
              tone={warning.level}
              label={warning.level.charAt(0).toUpperCase() + warning.level.slice(1) + ' warning'}
              headline={warning.weather.charAt(0).toUpperCase() + warning.weather.slice(1)}
              preview={'Includes ' + warning.matchedAreas.join(', ')}
            />
          ),
          content: (
            <div className="weather-warning__body">
              <section className="weather-warning__coverage" aria-label="Warning coverage">
                <h3>When and where</h3>
                <dl className="weather-warning__times">
                  <div>
                    <dt>From</dt>
                    <dd>
                      <time dateTime={warning.startsAt}>{warningTime(warning.startsAt)}</time>
                    </dd>
                  </div>
                  <div>
                    <dt>Until</dt>
                    <dd>
                      <time dateTime={warning.endsAt}>{warningTime(warning.endsAt)}</time>
                    </dd>
                  </div>
                </dl>
                <p className="weather-warning__scope">
                  Matched by your saved town/county names. A warning may cover only part of a listed
                  area; check the official map for exact coverage.
                </p>
              </section>
              <section className="weather-warning__advice" aria-label="Official warning">
                <h3>Met Office summary</h3>
                <p>{warning.description}</p>
                <p className="weather-warning__utc">
                  Times in the original summary are UTC. Validity times are shown in UK local time.
                </p>
                <a href={warning.url} target="_blank" rel="noopener noreferrer">
                  Read the warning, map and advice <Icon icon={ArrowUpRight} />
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </section>
            </div>
          ),
        }))}
      />
      <p className="weather-warnings__checked">
        {updatedAt && (
          <>
            Last checked <FriendlyTime value={updatedAt} /> ·{' '}
          </>
        )}
        © Crown copyright, Met Office
      </p>
    </section>
  )
}
