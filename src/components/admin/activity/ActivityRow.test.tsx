import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { ActivityEntry } from '../../../features/activity/types'
import { ActivityRow } from './ActivityRow'
const entry = (extra: Partial<ActivityEntry> = {}): ActivityEntry => ({
  id: '1',
  entityType: 'widget',
  entityId: '42',
  action: 'spun',
  actor: { id: 101, displayName: 'Synthetic' },
  occurredAt: '2026-10-25T12:00:00Z',
  targetName: null,
  before: null,
  after: null,
  ...extra,
})
describe('permitted widget history context', () => {
  it('shows recorded tool/reference/visibility without private payload fields or nested values', () => {
    render(
      <ul>
        <ActivityRow
          entry={entry({
            after: {
              kind: 'dinner-spinner',
              visibility: 'private',
              mealCount: 2,
              title: 'PRIVATE SENTINEL',
              choice: 'PRIVATE SENTINEL',
              meals: ['PRIVATE SENTINEL'],
              ownerId: { private: 'PRIVATE SENTINEL' },
              mealType: 'other',
            },
          })}
        />
      </ul>,
    )
    expect(screen.getByText(/spun Dinner Spinner/)).toBeTruthy()
    expect(screen.getByText(/Record reference #42/)).toBeTruthy()
    expect(screen.getByText(/Personal when recorded/)).toBeTruthy()
    expect(screen.getByText('Other meal', { exact: false })).toBeTruthy()
    expect(screen.queryByText(/PRIVATE SENTINEL/)).toBeNull()
  })
  it('labels missing generic context honestly and never infers from action or current setup', () => {
    render(
      <ul>
        <ActivityRow entry={entry({ action: 'published', after: { publicationId: '2' } })} />
      </ul>,
    )
    expect(screen.getByText(/Tool type was not recorded/)).toBeTruthy()
    expect(screen.queryByText(/Dinner Spinner/)).toBeNull()
  })
  it.each([
    ['focus_timer', 'personal Focus Timer'],
    ['daily_word', 'personal Daily Word'],
  ])('retains authoritative %s entity identity without optional kind', (entityType, label) => {
    render(
      <ul>
        <ActivityRow entry={entry({ entityType, after: { visibility: 'private' } })} />
      </ul>,
    )
    expect(screen.getByText(new RegExp('spun ' + label))).toBeTruthy()
    expect(screen.queryByText(/Tool type was not recorded/)).toBeNull()
  })
  it('ignores prototype property names as unrecognised kinds', () => {
    render(
      <ul>
        <ActivityRow entry={entry({ after: { kind: '__proto__' } })} />
      </ul>,
    )
    expect(screen.getByText(/Tool type was not recorded/)).toBeTruthy()
  })
})
