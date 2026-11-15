import type { ReactNode } from 'react'
import type { ZodiacSignId } from '../../../lib/zodiac'

// Original pictorial line drawings, designed together on a 24-unit grid.
// Explicit animal/person/object silhouettes rather than astrological glyphs.
const pictures: Record<ZodiacSignId, ReactNode> = {
  aries: (
    <>
      <path d="M8 12C1 12 2 3 7 4c4 1 2 6 0 5M16 12c7 0 6-9 1-8-4 1-2 6 0 5M8 8l1 10 3 3 3-3 1-10M9 16h6" />
      <path d="m10 12 .1 0m3.8 0h.1" />
    </>
  ),
  taurus: (
    <>
      <path d="M7 9C3 9 2 5 3 2c1 4 3 4 6 4m8 3c4 0 5-4 4-7-1 4-3 4-6 4M7 8l2 12 3 2 3-2 2-12-5-3Z" />
      <path d="m7 10-4 1 5 3m9-4 4 1-5 3M10 16h4m-4-5h.1m3.8 0h.1" />
    </>
  ),
  gemini: (
    <>
      <circle cx="7" cy="5" r="2.5" />
      <circle cx="17" cy="5" r="2.5" />
      <path d="M3 14v-3c0-3 8-3 8 0v3m2 0v-3c0-3 8-3 8 0v3M5 10v6l-1 5m5-11v6l1 5m5-11v6l-1 5m5-11v6l1 5M5 16h4m6 0h4M11 12h2" />
    </>
  ),
  cancer: (
    <>
      <ellipse cx="12" cy="14" rx="6" ry="4" />
      <path d="M7 12 4 9M17 12l3-3M4 9C0 8 1 4 3 3v3l3-2c2 3 0 5-2 5Zm16 0c4-1 3-5 1-6v3l-3-2c-2 3 0 5 2 5ZM6 14l-4 1m4 1-3 3m5-1-2 3m12-7 4 1m-4 1 3 3m-5-1 2 3M10 10V8m4 2V8" />
    </>
  ),
  leo: (
    <>
      <path d="m12 2 3 2 4 1 1 4 2 3-2 3-1 4-4 1-3 2-3-2-4-1-1-4-2-3 2-3 1-4 4-1Z" />
      <path d="M7 8v6l3 4h4l3-4V8l-3-1-2 2-2-2ZM10 12h.1m3.8 0h.1M10 15l2 1 2-1m-2 1v2" />
    </>
  ),
  virgo: (
    <>
      <path d="M8 9C4 8 6 2 10 2s6 6 2 7M7 21l2-9-2-1 3-2 4 2 2 8m-7-7 5 1M7 21h9M14 13l4-3m0-5v13m0-10-2-2m2 5 3-3m-3-3 2-2" />
      <circle cx="10" cy="6" r="2.5" />
    </>
  ),
  libra: (
    <>
      <path d="M12 3v17m-6 1h12M4 7h16M3 15l3-8 3 8Zm12 0 3-8 3 8ZM2 15c0 4 8 4 8 0m4 0c0 4 8 4 8 0" />
      <circle cx="12" cy="4" r="1.5" />
    </>
  ),
  scorpio: (
    <>
      <path d="M9 10 5 7 3 8 2 5l3-3 1 4m9 4 3-3 3 1 1-3-3-3-1 4M8 12l-4-1m4 4-4 1m5 1-3 3m10-8 4-1m-4 4 4 1M12 18c1 4 7 4 8 0s-2-6-4-4l2 1" />
      <ellipse cx="12" cy="13" rx="4" ry="5" />
      <path d="M9 12h6m-6 3h6" />
    </>
  ),
  sagittarius: (
    <>
      <circle cx="7" cy="4" r="2" />
      <path d="m7 7 4 4 5-1M7 7l-3 7 5 2 3 5m-8-7-2 6m5-10 8-3M17 3c5 5 5 12 0 17l1-17ZM11 11h11m-3-3 3 3-3 3" />
    </>
  ),
  capricorn: (
    <>
      <path d="M9 7C3 6 5 1 8 2L7 6m6 1c6-1 4-6 1-5l1 4M5 9l4-3 5 2 2 7c2-3 5-2 5 1 0 4-5 6-9 3l-4-5Zm0 0-2 3 5 2m2 1-1 6m4-3 1 3m-5-11h.1" />
    </>
  ),
  aquarius: (
    <>
      <circle cx="7" cy="4" r="2" />
      <path d="m7 7 4 3 4-1M7 7l-3 7 5 2 2 5m-7-7-2 7m6-10 5 2M16 7l5 2-2 7-5-2Z m0-7 1-2 5 2-1 2m-5 5-2 3m5-2-2 3M13 20c1-2 3 2 4 0s3 2 4 0" />
    </>
  ),
  pisces: (
    <>
      <path d="M2 7c5-6 10-3 13 0-3 4-8 6-13 0Zm13 0 6-4v8ZM22 17c-5 6-10 3-13 0 3-4 8-6 13 0Zm-13 0-6 4v-8Z" />
      <path d="M6 7h.1m11.8 10h.1M9 3l2-1m2 20 2-1" />
    </>
  ),
}

export function ZodiacIcon({ sign }: { sign: ZodiacSignId }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {pictures[sign]}
    </svg>
  )
}
