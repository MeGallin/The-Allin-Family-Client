import { useState, type InputHTMLAttributes, type Ref } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Icon } from './Icon'
import './PasswordInput.css'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  id: string
  passwordLabel?: string
  ref?: Ref<HTMLInputElement>
}

export function PasswordInput({ id, disabled, passwordLabel = 'password', ...props }: Props) {
  const [visible, setVisible] = useState(false)
  const action = `${visible ? 'Hide' : 'Show'} ${passwordLabel}`

  return (
    <div className="password-input">
      <input
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        {...props}
        id={id}
        disabled={disabled}
        type={visible ? 'text' : 'password'}
      />
      <button
        className="password-input__toggle"
        type="button"
        aria-label={action}
        aria-controls={id}
        title={action}
        disabled={disabled}
        onClick={() => setVisible((value) => !value)}
      >
        <Icon icon={visible ? EyeOff : Eye} />
      </button>
    </div>
  )
}
