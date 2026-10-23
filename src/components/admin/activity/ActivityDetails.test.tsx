import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { ActivityDetails } from './ActivityDetails'

it('labels an empty TfL selection clearly in preference change history', () => {
  render(
    <ActivityDetails
      entry={{
        id: '1',
        entityType: 'user_profile',
        entityId: '1',
        targetName: 'Dad',
        action: 'travel_preferences_changed',
        actor: { id: 1, displayName: 'Dad' },
        occurredAt: '2026-10-23T18:27:37Z',
        before: { travelLines: [] },
        after: { travelLines: ['Central', 'Circle'] },
      }}
    />,
  )
  expect(screen.getByText('TfL lines')).toBeTruthy()
  expect(screen.getByText('Switched off', { exact: false })).toBeTruthy()
  expect(screen.getByText('Central, Circle', { exact: false })).toBeTruthy()
})
