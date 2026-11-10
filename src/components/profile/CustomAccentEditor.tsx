import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { normalizeHex } from '../../features/appearance/accent-options'
import {
  customAccentTokens,
  hexToHsv,
  hsvToHex,
  type Hsv,
} from '../../features/appearance/custom-accent'
import { useDraftGuard } from '../../features/drafts/DraftProtection'
import { FamilyBrand } from '../brand/FamilyBrand'
import './CustomAccentEditor.css'

type Props = {
  id: string
  initialHex: string
  savedChanged: boolean
  onApply: (hex: string) => void
  onCancel: () => void
}
export function CustomAccentEditor({ id, initialHex, savedChanged, onApply, onCancel }: Props) {
  const initial = normalizeHex(initialHex) ?? '#22D3EE'
  const [hexInput, setHexInput] = useState(initial)
  const [hsv, setHsv] = useState(() => hexToHsv(initial))
  const input = useRef<HTMLInputElement>(null)
  const hex = normalizeHex(hexInput)
  const previewHex = hex ?? hsvToHex(hsv)
  const tokens = customAccentTokens(previewHex)
  const guard = useDraftGuard((hex ?? hexInput) !== initial)
  useEffect(() => {
    input.current?.focus()
  }, [])
  function update(next: Hsv) {
    setHsv(next)
    setHexInput(hsvToHex(next))
  }
  function point(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    update({
      ...hsv,
      s: Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100)),
      v: Math.max(0, Math.min(100, 100 - ((event.clientY - rect.top) / rect.height) * 100)),
    })
  }
  function cancel() {
    guard.complete(onCancel)
  }
  return (
    <section
      className="custom-accent"
      id={id}
      aria-labelledby={id + '-title'}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          event.stopPropagation()
          cancel()
        }
      }}
    >
      <div>
        <h4 id={id + '-title'}>Custom colour</h4>
        <p className="note">Adjust the hue, saturation and shade.</p>
      </div>
      <div className="custom-accent__controls">
        <div>
          <p className="note">Colour area · drag or touch to tune</p>
          <div
            className="custom-accent__area"
            aria-hidden="true"
            style={
              {
                '--picker-hue': hsv.h,
                '--picker-x': `${hsv.s}%`,
                '--picker-y': `${100 - hsv.v}%`,
              } as CSSProperties
            }
            onPointerDown={(event) => {
              if (!event.isPrimary || event.button !== 0) return
              event.currentTarget.setPointerCapture(event.pointerId)
              point(event)
            }}
            onPointerMove={(event) => {
              if (event.currentTarget.hasPointerCapture(event.pointerId)) point(event)
            }}
            onPointerUp={(event) => {
              if (event.currentTarget.hasPointerCapture(event.pointerId))
                event.currentTarget.releasePointerCapture(event.pointerId)
            }}
            onPointerCancel={(event) => {
              if (event.currentTarget.hasPointerCapture(event.pointerId))
                event.currentTarget.releasePointerCapture(event.pointerId)
            }}
          >
            <span />
          </div>
        </div>
        <div className="custom-accent__ranges">
          {(
            [
              { axis: 'h', label: 'Hue', max: 359, unit: '°' },
              { axis: 's', label: 'Saturation', max: 100, unit: '%' },
              { axis: 'v', label: 'Shade', max: 100, unit: '%' },
            ] as const
          ).map(({ axis, label, max, unit }) => (
            <label key={axis} className="custom-accent__range">
              <span>
                {label}{' '}
                <output>
                  {Math.round(hsv[axis])}
                  {unit}
                </output>
              </span>
              <input
                type="range"
                min="0"
                max={max}
                step="1"
                value={Math.round(hsv[axis])}
                aria-label={label}
                aria-valuetext={`${Math.round(hsv[axis])}${axis === 'h' ? ' degrees' : ' percent'}`}
                onChange={(event) => update({ ...hsv, [axis]: Number(event.target.value) })}
              />
            </label>
          ))}
        </div>
      </div>
      <label className="custom-accent__hex" htmlFor={id + '-hex'}>
        HEX value
        <input
          ref={input}
          id={id + '-hex'}
          type="text"
          value={hexInput}
          maxLength={7}
          autoComplete="off"
          spellCheck={false}
          aria-invalid={!hex}
          aria-describedby={id + '-hex-help'}
          onChange={(event) => {
            const value = event.target.value
            setHexInput(value)
            const valid = normalizeHex(value)
            if (valid) setHsv(hexToHsv(valid))
          }}
        />
      </label>
      <p className={hex ? 'note' : 'error'} id={id + '-hex-help'}>
        {hex
          ? 'Use # followed by six letters or numbers, such as #345678.'
          : 'Enter a valid HEX colour, such as #345678.'}
      </p>
      <div
        className="custom-accent__sample"
        style={tokens as CSSProperties}
        role="img"
        aria-label={`Draft preview ${previewHex}: Allin mark, selected Profile tab and example action button`}
      >
        <div className="custom-accent__sample-heading">
          <FamilyBrand variant="shield" size="small" />
          <strong>Draft preview</strong>
          <code>{previewHex}</code>
        </div>
        <div className="custom-accent__sample-controls" aria-hidden="true">
          <span className="custom-accent__sample-tab">Profile</span>
          <span className="custom-accent__sample-button">View family plan</span>
        </div>
      </div>
      <p className="note">
        Only this sample changes until you apply.
        {tokens['--color-accent'] !== previewHex
          ? ' Your exact colour is kept; highlights are lightened for readability on navy.'
          : ''}
      </p>
      {savedChanged && (
        <p className="note" role="status">
          Your saved colour changed in another tab. Apply to use this draft, or Cancel to keep the
          saved choice.
        </p>
      )}
      <div className="actions custom-accent__actions">
        <button type="button" className="secondary" onClick={cancel}>
          Cancel
        </button>
        <button
          type="button"
          disabled={!hex}
          onClick={() => {
            if (hex) guard.complete(() => onApply(hex))
          }}
        >
          Apply colour
        </button>
      </div>
    </section>
  )
}
