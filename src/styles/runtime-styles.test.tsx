import { StrictMode } from 'react'
import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { useRuntimeStyles } from './runtime-styles'

function Sample({ value }: { value: string }) {
  const className = useRuntimeStyles({ transform: `rotate(${value}deg)` })
  return <div data-testid="sample" className={className} />
}
function rules() {
  return (document.adoptedStyleSheets ?? []).flatMap((sheet) =>
    Array.from(sheet.cssRules),
  ) as CSSStyleRule[]
}

it('updates isolated instance rules without inline attributes or style tags and releases them on unmount', () => {
  const before = rules().length
  const styleTags = document.querySelectorAll('style').length
  const view = render(
    <StrictMode>
      <Sample value="30" />
      <Sample value="60" />
    </StrictMode>,
  )
  const [first, second] = screen.getAllByTestId('sample')
  expect(first.hasAttribute('style')).toBe(false)
  expect(second.hasAttribute('style')).toBe(false)
  expect(first.className).not.toBe(second.className)
  expect(rules().length).toBe(before + 2)
  const firstRule = rules().find((rule) => rule.selectorText.includes(first.className))!
  expect(firstRule.style.getPropertyValue('transform')).toBe('rotate(30deg)')
  view.rerender(
    <StrictMode>
      <Sample value="90" />
      <Sample value="60" />
    </StrictMode>,
  )
  expect(rules().length).toBe(before + 2)
  expect(rules().find((rule) => rule.selectorText.includes(first.className))).toBe(firstRule)
  expect(firstRule.style.getPropertyValue('transform')).toBe('rotate(90deg)')
  expect(document.querySelectorAll('style').length).toBe(styleTags)
  view.unmount()
  expect(rules().length).toBe(before)
})

it('rejects unsafe declarations before changing existing rules', () => {
  const before = rules().length
  expect(() => render(<Sample value="0); background: url(https://invalid.example)" />)).toThrow(
    /Unsupported runtime CSS/,
  )
  expect(rules().length).toBe(before)
})
