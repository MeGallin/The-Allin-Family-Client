import { PageHeader } from '../../components/ui/PageHeader'
import { FoodAlerts } from '../../components/family/alerts/FoodAlerts'

export default function AlertsPage() {
  return (
    <div className="page-stack page-enter">
      <PageHeader title="Alerts" description="Useful notices to keep the family informed." />
      <div className="content-surface">
        <FoodAlerts />
      </div>
    </div>
  )
}
