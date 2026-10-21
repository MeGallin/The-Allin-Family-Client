import { Component, type ReactNode } from 'react'

type Props = { children: ReactNode }

export class ErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed) {
      return (
        <main className="app-shell">
          <section className="surface-card">
            <h1 className="page-title">Let’s try that again.</h1>
            <p role="alert">This part of your family space could not be loaded.</p>
            <button type="button" onClick={() => window.location.reload()}>
              Reload page
            </button>
          </section>
        </main>
      )
    }
    return this.props.children
  }
}
