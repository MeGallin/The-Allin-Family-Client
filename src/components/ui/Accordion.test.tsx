import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Accordion } from './Accordion'

const items = [
  { id: 'first', title: 'First notice', content: <p>First details</p> },
  { id: 'second', title: 'Second notice', content: <p>Second details</p> },
]

describe('Accordion', () => {
  it('opens only the selected item, including switching back to an earlier one', () => {
    render(<Accordion items={items} />)
    const first = screen.getByText('First notice')
    const second = screen.getByText('Second notice')
    expect(first.closest('details')!.open).toBe(false)
    expect(second.closest('details')!.open).toBe(false)
    fireEvent.click(first)
    expect(first.closest('details')!.open).toBe(true)
    fireEvent.click(second)
    expect(first.closest('details')!.open).toBe(false)
    expect(second.closest('details')!.open).toBe(true)
    fireEvent.click(first)
    expect(first.closest('details')!.open).toBe(true)
    expect(second.closest('details')!.open).toBe(false)
  })

  it('allows the selected item to close without opening another', () => {
    const view = render(<Accordion items={items} />)
    fireEvent.click(screen.getByText('First notice'))
    fireEvent.click(screen.getByText('First notice'))
    expect(view.container.querySelectorAll('details[open]')).toHaveLength(0)
  })

  it('keeps different accordion groups independent, even with the same item IDs', () => {
    render(
      <>
        <section aria-label="One">
          <Accordion items={items} />
        </section>
        <section aria-label="Two">
          <Accordion items={items} />
        </section>
      </>,
    )
    const one = within(screen.getByRole('region', { name: 'One' }))
    const two = within(screen.getByRole('region', { name: 'Two' }))
    fireEvent.click(one.getByText('First notice'))
    fireEvent.click(two.getByText('Second notice'))
    expect(one.getByText('First notice').closest('details')!.open).toBe(true)
    expect(two.getByText('Second notice').closest('details')!.open).toBe(true)
  })
})
