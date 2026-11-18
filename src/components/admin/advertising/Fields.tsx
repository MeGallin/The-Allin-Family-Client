import type { AdvertConfig } from '../../../features/advertising/types'
export type EditAdvert = (change: (draft: AdvertConfig) => void) => void
export function TextField({
  label,
  value,
  onChange,
  maxLength = 240,
  type = 'text',
  required = true,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  maxLength?: number
  type?: string
  required?: boolean
}) {
  return (
    <label>
      {label}
      <input
        type={type}
        value={value}
        maxLength={maxLength}
        required={required}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}
export function NumberField({
  label,
  value,
  onChange,
  min = 0,
  max = 10000000,
  step = 1,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
}) {
  return (
    <label>
      {label}
      <input
        type="number"
        value={Number.isFinite(value) ? value : ''}
        min={min}
        max={max}
        step={step}
        required
        onChange={(e) => onChange(e.target.valueAsNumber)}
      />
    </label>
  )
}
export function SwitchField({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="advert-settings__switch">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  )
}
export function LinesField({
  label,
  value,
  onChange,
  maxLength = 2200,
}: {
  label: string
  value: string[]
  onChange: (v: string[]) => void
  maxLength?: number
}) {
  return (
    <label>
      {label}
      <textarea
        rows={3}
        value={value.join('\n')}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value.split('\n'))}
      />
      <span className="note">One entry per line. Blank lines are omitted when saving.</span>
    </label>
  )
}
