import { useId } from 'react'
export function ReportingPeriodSelect({
  value,
  onChange,
  allowAll = false,
  label = 'Reporting period',
}: {
  value: string
  onChange: (value: string) => void
  allowAll?: boolean
  label?: string
}) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="7">Last 7 days</option>
        <option value="30">Last 30 days</option>
        <option value="90">Last 90 days</option>
        {allowAll && <option value="0">All recorded history</option>}
      </select>
    </div>
  )
}
