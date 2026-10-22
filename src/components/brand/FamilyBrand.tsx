import shieldUrl from '../../../favicon.svg'
import './FamilyBrand.css'

type Props = {
  variant?: 'wordmark' | 'shield'
  size?: 'small' | 'medium' | 'large'
}

/** The shield's A is the first letter of Allin, not a separate leading icon. */
export function FamilyBrand({ variant = 'wordmark', size = 'medium' }: Props) {
  return (
    <span
      className={`family-logo family-logo--${variant} family-logo--${size}`}
      role="img"
      aria-label="The Allin Family"
    >
      <img className="family-logo__shield" src={shieldUrl} alt="" aria-hidden="true" />
      {variant === 'wordmark' && (
        <span className="family-logo__name" aria-hidden="true">
          llin <span className="family-logo__family">Family</span>
        </span>
      )}
    </span>
  )
}
