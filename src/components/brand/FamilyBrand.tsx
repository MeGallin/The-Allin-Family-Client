import './FamilyBrand.css'

type Props = {
  variant?: 'wordmark' | 'shield'
  size?: 'small' | 'medium' | 'large'
}

/** The calligraphic A is the first letter of Allin, not a separate leading icon. */
export function FamilyBrand({ variant = 'wordmark', size = 'medium' }: Props) {
  return (
    <span
      className={`family-logo family-logo--${variant} family-logo--${size}`}
      role="img"
      aria-label="The Allin Family"
    >
      <svg
        className="family-logo__mark"
        viewBox="25 21 150 165"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M36 159C58 130 75 77 91 42c6-14 17-13 23 2 12 28 17 56 29 86 5 13 12 23 23 29h-36c-11-18-16-48-29-78-11 31-23 59-29 78H36Z"
          fill="var(--color-accent)"
        />
        <path
          fill="var(--color-text-on-dark)"
          d="M72 114c18-7 39-9 57-4l7 16c-21-6-43-3-69 8l5-20Z"
        />
      </svg>
      {variant === 'wordmark' && (
        <span className="family-logo__name" aria-hidden="true">
          <span className="family-logo__the">The</span>
          <svg
            className="family-logo__letters"
            viewBox="-40 21 200 165"
            fill="currentColor"
            aria-hidden="true"
            focusable="false"
          >
            {/* Match the A's descending leg with a strong left lean anchored at the feet. */}
            <g transform="translate(0 159) skewX(24) translate(0 -159)">
              <path d="M9 63c5-3 11-4 17-3-1 27-6 59-11 84 7 3 16 2 23-3l-5 17c-10 3-22 2-33 1 6-28 8-64 9-96Z" />
              <path
                d="M9 63c5-3 11-4 17-3-1 27-6 59-11 84 7 3 16 2 23-3l-5 17c-10 3-22 2-33 1 6-28 8-64 9-96Z"
                transform="translate(38 0)"
              />
              <path d="M79.5 108c8-2 17-3 24-2-2 12-5.5 24-8.5 33-3 8-3 14 2 11l-3 10c-6 3-15 3-20-2 4-13 6-31 5.5-50Z" />
              <path
                d="M108 62c5-3 10-3 14-1 6 17 10 40 16 60 2-21 3-42 3-59 5-2 10-3 14-1-1 32-5 69-11 98-5 2-10 2-14 0-6-17-10-40-16-59-2 21-5 42-9 59-4 2-9 3-13 1 6-29 11-66 16-98Z"
                transform="translate(6 0)"
              />
            </g>
            {/* Keep a compact square dot centred just above the i stem. */}
            <rect
              x="52.9"
              y="88"
              width="14"
              height="14"
              fill="var(--color-text-on-dark)"
            />
          </svg>
          <span className="family-logo__family">Family</span>
        </span>
      )}
    </span>
  )
}
