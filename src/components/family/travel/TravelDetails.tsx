import { TrainFront } from 'lucide-react'
import { Link } from 'react-router'
import type { CalendarTravelProps } from '../home/CalendarTravel'
import { Accordion } from '../../ui/Accordion'
import { AlertSource } from '../../ui/AlertBriefing'
import { FriendlyTime } from '../../ui/FriendlyTime'
import { TravelNoticeDetails, TravelNoticeSummary } from './TravelNotice'
import './TravelDetails.css'

export default function TravelDetails({
  notices,
  stale,
  unavailable,
  liveUpdatedAt,
  plannedUpdatedAt,
}: CalendarTravelProps) {
  const lineCount = new Set(notices.map((notice) => notice.lineId)).size
  return (
    <section className="travel-details" aria-label="Transport for London disruptions">
      <AlertSource
        provider="Transport for London"
        icon={TrainFront}
        description={`${lineCount} affected ${lineCount === 1 ? 'line' : 'lines'} · ${notices.length} service ${notices.length === 1 ? 'notice' : 'notices'}`}
        href="https://tfl.gov.uk/tube-dlr-overground/status/"
        linkLabel="Check TfL status"
      />
      {(stale || unavailable) && (
        <p className="alert-briefing__status" role="status">
          {unavailable ? 'Some TfL updates are unavailable.' : 'TfL updates are delayed.'} Saved
          notices may be out of date. Check TfL before travelling.
        </p>
      )}
      <Accordion
        className="travel-notices"
        itemClassName="travel-notice"
        summaryClassName="travel-notice__summary"
        items={notices.map((notice) => ({
          id: notice.id + (notice.planned ? '-planned' : '-live'),
          title: <TravelNoticeSummary notice={notice} />,
          content: <TravelNoticeDetails notice={notice} />,
        }))}
      />
      {!notices.length && (
        <p className="alert-briefing__status">
          No current notices are available here. This does not confirm normal service.
        </p>
      )}
      <footer className="alert-briefing__footer">
        {liveUpdatedAt && (
          <p>
            Live status checked <FriendlyTime value={liveUpdatedAt} />
          </p>
        )}
        {plannedUpdatedAt && (
          <p>
            Planned works checked <FriendlyTime value={plannedUpdatedAt} />
          </p>
        )}
        <p>
          Powered by TfL Open Data. Published planned works are checked for the next 30 days; later
          dates are not covered.
        </p>
        <Link to="/profile">Change your TfL lines</Link>
      </footer>
    </section>
  )
}
