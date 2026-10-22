import { useId, type CSSProperties } from 'react'
import { Check } from 'lucide-react'
import { Icon } from '../ui/Icon'
import { ACCENT_CHOICES } from '../../features/appearance/accent-options'
import { useAccentPreference } from '../../features/appearance/useAppearance'
import './AccentPicker.css'
export function AccentPicker() {
  const id = useId()
  const { accent, persisted, choose } = useAccentPreference()
  const selected = ACCENT_CHOICES.find((choice) => choice.id === accent)!
  return (
    <fieldset className="accent-picker" aria-describedby={id + '-help'}>
      <legend>Accent colour</legend>
      <p className="note" id={id + '-help'}>
        A little more you. Choose a highlight colour, remembered for your account in this browser.
      </p>
      <div className="accent-picker__choices">
        {ACCENT_CHOICES.map((choice) => (
          <label
            key={choice.id}
            className={'accent-picker__choice' + (choice.id === accent ? ' is-selected' : '')}
            style={{ '--choice-colour': `var(--accent-${choice.id})` } as CSSProperties}
          >
            <input
              type="radio"
              name={id}
              value={choice.id}
              checked={choice.id === accent}
              onChange={() => choose(choice.id)}
            />
            <span className="accent-picker__swatch" aria-hidden="true">
              {choice.id === accent && (
                <span className="accent-picker__check">
                  <Icon icon={Check} />
                </span>
              )}
            </span>
            <span className="accent-picker__label">{choice.label}</span>
          </label>
        ))}
      </div>
      <p className="note accent-picker__feedback" role="status">
        {persisted
          ? `${selected.label} selected.`
          : `${selected.label} applied for this visit. Your browser couldn't save this choice.`}
      </p>
    </fieldset>
  )
}
