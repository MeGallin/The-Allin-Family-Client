import { TrainFront } from 'lucide-react'
import { Icon } from '../../ui/Icon'
import './TravelLineLabel.css'

/** TfL identity colours live in shared tokens; unknown lines retain Nimbus styling. */
export function TravelLineLabel({ lineId, name }: { lineId: string; name: string }) {
  return (
    <span className="travel-line-label" data-line={lineId}>
      {name}
    </span>
  )
}

export function TravelLineIcon({ lineId }: { lineId: string }) {
  return (
    <span className="alert-briefing__mark travel-line-icon" data-line={lineId} aria-hidden="true">
      <Icon icon={TrainFront} />
    </span>
  )
}
