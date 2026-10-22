import { describe, expect, it } from 'vitest'
import { createSearchMatcher, filterOption, normaliseSearch, searchQuery } from './search'
import { pollsView } from '../features/polls/polls-view'
import type { FamilyPollRecord } from '../features/polls/types'
describe('shared search matching', () => {
  it('trims, ignores case and matches equivalent Unicode consistently', () => {
    expect(normaliseSearch('  DAD  ')).toBe('dad')
    expect(createSearchMatcher('  dAd ')(['Milk', 'Dad'])).toBe(true)
    expect(createSearchMatcher('café')(['Cafe\u0301'])).toBe(true)
    expect(createSearchMatcher('   ')([])).toBe(true)
    expect(createSearchMatcher('milk')(['bread'])).toBe(false)
    expect(createSearchMatcher('Dad Milk')(['Dad', 'Milk'])).toBe(false)
  })
  it('shares query limits and option validation', () => {
    expect(searchQuery(null)).toBe('')
    expect(searchQuery('x'.repeat(101))).toHaveLength(100)
    expect(
      filterOption(
        'bad',
        [
          ['newest', 'Newest'],
          ['name', 'A-Z'],
        ] as const,
        'newest',
      ),
    ).toBe('newest')
  })
  it('keeps poll rules outside the page, including editors and exact expiry boundaries', () => {
    const now = Date.now()
    const record = {
      id: '1',
      title: 'Dinner',
      detail: 'Pasta',
      closed: false,
      closesAt: new Date(now + 1000).toISOString(),
      createdBy: { displayName: 'Dad' },
      updatedBy: { displayName: 'Andrea' },
    } as FamilyPollRecord
    expect(pollsView([record], 'ANDREA', 'open', now)).toEqual([record])
    expect(pollsView([record], 'pasta', 'closed', now)).toEqual([])
    expect(pollsView([record], 'pasta', 'closed', now + 1000)).toEqual([record])
    expect(pollsView([record], 'Dad', 'all', now + 1000)).toEqual([record])
  })
})
