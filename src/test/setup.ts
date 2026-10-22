import { afterEach, beforeEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
// jsdom has no native modal presentation. Keep the real component and its lifecycle.
Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
  configurable: true,
  value() {
    this.setAttribute('open', '')
  },
})
Object.defineProperty(HTMLDialogElement.prototype, 'close', {
  configurable: true,
  value() {
    this.removeAttribute('open')
  },
})
beforeEach(() => {
  // A missed mock must fail rather than contact Gary's running application.
  vi.stubGlobal(
    'fetch',
    vi.fn(() => {
      throw new Error('Unexpected HTTP request in client test')
    }),
  )
})
afterEach(() => {
  cleanup()
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
