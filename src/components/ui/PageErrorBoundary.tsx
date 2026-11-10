import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router'
import { ErrorBoundary, ErrorRecovery } from './ErrorBoundary'

// Keep the family shell, sync owners and draft protection alive when a page fails.
export function PageErrorBoundary({ children }: { children: ReactNode }) {
  const location = useLocation()
  return (
    <ErrorBoundary
      resetKey={location.key}
      fallback={
        <ErrorRecovery
          embedded
          home={
            <Link className="button-link secondary" to="/">
              Home
            </Link>
          }
        />
      }
    >
      {children}
    </ErrorBoundary>
  )
}
