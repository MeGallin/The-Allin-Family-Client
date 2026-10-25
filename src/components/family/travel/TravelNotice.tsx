import { Clock3, Info, Route, TriangleAlert } from 'lucide-react'
import type { TravelNotice } from '../../../features/travel/types'
import { formatUkDate, formatUkTime } from '../../../lib/uk-time'
import { Icon } from '../../ui/Icon'
import { TravelLineIcon, TravelLineLabel } from './TravelLineLabel'
import './TravelNotice.css'

export function TravelNoticeSummary({ notice }: { notice: TravelNotice }) {
  return (
    <>
      <span className="travel-notice__identity">
        <TravelLineIcon lineId={notice.lineId} />
        <TravelLineLabel lineId={notice.lineId} name={notice.line} />
      </span>
      <span className="travel-notice__status">
        <span className="travel-notice__kind">
          {notice.planned ? 'Planned works' : 'Live status'}
        </span>
        <span
          className={
            'travel-notice__condition ' +
            (notice.planned ? 'travel-notice__condition--planned' : '')
          }
        >
          <Icon icon={notice.planned ? Clock3 : TriangleAlert} />
          {notice.status}
        </span>
      </span>
      <span className="travel-notice__preview">
        {notice.description || 'Open for the available service information'}
      </span>
    </>
  )
}

/** Sections describe this notice, not a sequence of incident updates. */
export function TravelNoticeDetails({ notice }: { notice: TravelNotice }) {
  return (
    <div className="travel-notice__details">
      <div className="travel-notice__timeline" data-line={notice.lineId}>
        <section className="travel-notice__step" aria-label="Service information">
          <h3>
            <Icon icon={Info} /> Service information
          </h3>
          <p>
            {notice.description ||
              'TfL has not supplied further detail. Check the official service status before travelling.'}
          </p>
        </section>
        <section className="travel-notice__step" aria-label="TfL travel advice">
          <h3>
            <Icon icon={Route} /> TfL travel advice
          </h3>
          <p>{notice.advice || 'TfL has not supplied separate travel advice for this notice.'}</p>
        </section>
        <section
          className="travel-notice__step travel-notice__timing"
          aria-label="Published validity"
        >
          <h3>
            <Icon icon={Clock3} />{' '}
            {notice.planned ? 'Published works window' : 'Published validity window'}
          </h3>
          <dl>
            <div>
              <dt>From</dt>
              <dd>
                {notice.startsAt ? (
                  <time dateTime={notice.startsAt}>
                    <strong>{formatUkTime(notice.startsAt)}</strong>
                    <span>{formatUkDate(notice.startsAt)}</span>
                  </time>
                ) : (
                  'Not supplied by TfL'
                )}
              </dd>
            </div>
            <div>
              <dt>Until</dt>
              <dd>
                {notice.endsAt ? (
                  <time dateTime={notice.endsAt}>
                    <strong>{formatUkTime(notice.endsAt)}</strong>
                    <span>{formatUkDate(notice.endsAt)}</span>
                  </time>
                ) : (
                  'Not supplied by TfL'
                )}
              </dd>
            </div>
          </dl>
          <p className="travel-notice__caveat">
            {notice.planned
              ? 'UK local times. Works may span more than one day; published times can change.'
              : 'UK local times. This is TfL’s validity window, not an expected recovery time. Live delays appear on today’s tile only.'}
          </p>
        </section>
      </div>
    </div>
  )
}
