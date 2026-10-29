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
      <svg
        className="family-logo__shield"
        viewBox="0 0 200 220"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M100 12 180 39v65c0 46-32 78-80 104-48-26-80-58-80-104V39Z"
          stroke="currentColor"
          strokeWidth="5"
        />
        <path
          fill="var(--color-text-on-dark)"
          fillRule="evenodd"
          d="m100 42 49 111h-22l-10-25H83l-10 25H51L100 42Zm0 42-12 28h24l-12-28Z"
        />
        <path d="M79 120h42" stroke="currentColor" strokeWidth="7" />
        <path
          d="m82 170 18 12 18-12"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="square"
        />
      </svg>
      {variant === 'wordmark' && (
        <span className="family-logo__name" aria-hidden="true">
          llin <span className="family-logo__family">Family</span>
        </span>
      )}
    </span>
  )
}
