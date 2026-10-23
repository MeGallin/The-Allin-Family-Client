import { render, screen, within } from '@testing-library/react'
import { expect, it } from 'vitest'
import type { TravelNotice } from '../../../features/travel/types'
import { TravelNoticeDetails } from './TravelNotice'

const notice: TravelNotice = {
  id: 'notice',
  lineId: 'circle',
  line: 'Circle',
  status: 'Part Closure',
  severity: 5,
  description: 'Official service description.',
  advice: 'Official additional information.',
  planned: true,
  startsAt: '2026-10-24T03:30:00Z',
  endsAt: '2026-10-26T01:29:00Z',
}

it('renders supplied text verbatim and UK validity times across the clock change', () => {
  const { container } = render(<TravelNoticeDetails notice={notice} />)
  expect(screen.getByText(notice.description)).toBeTruthy()
  expect(screen.getByText(notice.advice)).toBeTruthy()
  expect(screen.getByText('04:30 BST')).toBeTruthy()
  expect(screen.getByText('01:29 GMT')).toBeTruthy()
  expect(screen.getByText('24 Oct 2026')).toBeTruthy()
  expect(screen.getByText('26 Oct 2026')).toBeTruthy()
  expect(container.querySelector('.travel-notice__timeline')?.getAttribute('data-line')).toBe(
    'circle',
  )
  expect(container.querySelectorAll('time')[1].getAttribute('dateTime')).toBe(notice.endsAt)
})

it('states missing advice and dates explicitly without inventing content', () => {
  const { container } = render(
    <TravelNoticeDetails
      notice={{ ...notice, description: '', advice: '', startsAt: null, endsAt: null }}
    />,
  )
  expect(
    screen.getByText('TfL has not supplied separate travel advice for this notice.'),
  ).toBeTruthy()
  expect(screen.getByText(/TfL has not supplied further detail/)).toBeTruthy()
  expect(screen.getAllByText('Not supplied by TfL')).toHaveLength(2)
  expect(container.querySelectorAll('time')).toHaveLength(0)
  expect(screen.queryByText(notice.advice)).toBeNull()
})

it('retains an available start independently of an absent end', () => {
  render(<TravelNoticeDetails notice={{ ...notice, endsAt: null }} />)
  const validity = screen.getByRole('region', { name: 'Published validity' })
  expect(within(validity).getByText('04:30 BST')).toBeTruthy()
  expect(within(validity).getByText('Not supplied by TfL')).toBeTruthy()
})

it('retains an available end independently of an absent start', () => {
  render(<TravelNoticeDetails notice={{ ...notice, startsAt: null }} />)
  const validity = screen.getByRole('region', { name: 'Published validity' })
  expect(within(validity).getByText('01:29 GMT')).toBeTruthy()
  expect(within(validity).getByText('Not supplied by TfL')).toBeTruthy()
})
