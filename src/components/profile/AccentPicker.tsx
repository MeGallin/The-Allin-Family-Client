import { useId, useRef, useState, type CSSProperties } from 'react'
import { Check } from 'lucide-react'
import { Icon } from '../ui/Icon'
import { ACCENT_CHOICES, accentKey } from '../../features/appearance/accent-options'
import { useAccentPreference } from '../../features/appearance/useAppearance'
import { CustomAccentEditor } from './CustomAccentEditor'
import './AccentPicker.css'
export function AccentPicker() {
  const preference = useAccentPreference()
  return <AccentPickerChoices key={preference.ownerId ?? 'browser'} {...preference} />
}
function AccentPickerChoices({
  accent,
  persisted,
  choose,
}: ReturnType<typeof useAccentPreference>) {
  const id = useId()
  const [editing, setEditing] = useState<{ initialHex: string; savedKey: string } | null>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const selected =
    typeof accent === 'object'
      ? `Custom ${accent.hex}`
      : ACCENT_CHOICES.find((choice) => choice.id === accent)!.label
  function close() {
    setEditing(null)
    trigger.current?.focus()
  }
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
              onClick={() => setEditing(null)}
              onChange={() => {
                setEditing(null)
                choose(choice.id)
              }}
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
      <button
        ref={trigger}
        type="button"
        className="secondary accent-picker__custom"
        aria-expanded={editing !== null}
        aria-controls={id + '-editor'}
        onClick={() => {
          if (!editing)
            setEditing({
              initialHex:
                typeof accent === 'object'
                  ? accent.hex
                  : getComputedStyle(document.documentElement)
                      .getPropertyValue(`--accent-${accent}`)
                      .trim(),
              savedKey: accentKey(accent),
            })
        }}
      >
        <span>
          {typeof accent === 'object' ? 'Custom colour selected' : 'Choose a custom colour'}
        </span>
        {typeof accent === 'object' && (
          <>
            {' '}
            <code>{accent.hex}</code>
          </>
        )}
      </button>
      {editing && (
        <CustomAccentEditor
          id={id + '-editor'}
          initialHex={editing.initialHex}
          savedChanged={editing.savedKey !== accentKey(accent)}
          onApply={(hex) => {
            choose({ version: 2, kind: 'custom', hex })
            close()
          }}
          onCancel={close}
        />
      )}
      <p className="note accent-picker__feedback" role="status">
        {persisted
          ? `${selected} selected.`
          : `${selected} applied for this visit. Your browser couldn't save this choice.`}
      </p>
    </fieldset>
  )
}
