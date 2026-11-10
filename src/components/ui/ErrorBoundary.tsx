import { Component, useEffect, useRef, type ReactNode } from 'react'
import './ErrorBoundary.css'

type Props = { children: ReactNode; fallback?: ReactNode; resetKey?: string }

export function ErrorRecovery({
  home,
  embedded = false,
}: {
  home?: ReactNode
  embedded?: boolean
}) {
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => heading.current?.focus(), [])
  const Container = embedded ? 'div' : 'main'
  return (
    <Container className="error-recovery">
      <section className="surface-card">
        <h1 className="page-title" ref={heading} tabIndex={-1}>
          Let’s try that again.
        </h1>
        <p role="alert">This part of your family space could not be loaded.</p>
        <div className="actions">
          <button type="button" onClick={() => window.location.reload()}>
            Reload page
          </button>
          {home ?? (
            <a className="button-link secondary" href="/">
              Home
            </a>
          )}
        </div>
      </section>
    </Container>
  )
}

export class ErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidUpdate(previous: Props) {
    if (this.state.failed && previous.resetKey !== this.props.resetKey) {
      this.setState({ failed: false })
    }
  }

  render() {
    if (this.state.failed) {
      return this.props.fallback ?? <ErrorRecovery />
    }
    return this.props.children
  }
}
