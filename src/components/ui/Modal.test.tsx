import { readFileSync } from 'node:fs'
import { render } from '@testing-library/react'
import { expect, it } from 'vitest'
import { Modal } from './Modal'

it('keeps page scrolling locked until the final nested modal closes, without inline styles', () => {
  // Test-only CSS fixture: jsdom does not apply Vite's imported CSS automatically.
  const css = document.createElement('style')
  css.textContent =
    'body { overflow: auto; }\n' + readFileSync('src/components/ui/Modal.css', 'utf8')
  document.head.append(css)
  const view = render(
    <>
      <Modal title="First" onClose={() => {}}>
        First
      </Modal>
      <Modal title="Second" onClose={() => {}}>
        Second
      </Modal>
    </>,
  )
  try {
    expect(document.body.hasAttribute('style')).toBe(false)
    expect(getComputedStyle(document.body).overflow).toBe('hidden')
    view.rerender(
      <Modal title="Second" onClose={() => {}}>
        Second
      </Modal>,
    )
    expect(getComputedStyle(document.body).overflow).toBe('hidden')
    view.unmount()
    expect(getComputedStyle(document.body).overflow).toBe('auto')
    expect(document.body.hasAttribute('style')).toBe(false)
  } finally {
    view.unmount()
    css.remove()
  }
})
