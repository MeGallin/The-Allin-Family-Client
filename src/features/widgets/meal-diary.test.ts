import { describe, expect, it } from 'vitest'
import { diaryDays, familyMeals, mealDecision, mealLink, mealMilestone } from './meal-diary'
import type { DinnerPublication, FamilyWidget } from './types'
const publication = (overrides: Partial<DinnerPublication> = {}): DinnerPublication => ({
  id: '1',
  spinId: '1',
  meal: 'Soup',
  mealType: 'lunch',
  forDate: '2026-10-24',
  current: true,
  eatenAt: null,
  eatenBy: null,
  publishedAt: '2026-10-24T10:00:00Z',
  publisher: { id: 1, name: 'Dad' },
  members: [
    { id: 1, name: 'Dad', active: true, choice: null, version: 0, respondedAt: null },
    { id: 2, name: 'Member', active: true, choice: null, version: 0, respondedAt: null },
  ],
  ...overrides,
})
const widget = (publications: DinnerPublication[]): FamilyWidget => ({
  id: '42',
  kind: 'dinner-spinner',
  title: 'Family meals',
  owner: { id: 1, name: 'Dad' },
  visibility: 'family',
  version: 1,
  hidden: false,
  createdAt: '2026-10-24T10:00:00Z',
  updatedAt: '2026-10-24T10:00:00Z',
  meals: [],
  spins: [],
  publications,
})
describe('Meal diary decisions and calendar days', () => {
  it('keeps a no-response choice as the default without inventing votes', () => {
    const original = publication()
    const decision = mealDecision(original)
    expect(decision.status).toBe('Chosen by default')
    expect(decision.agreed).toBe(0)
    expect(decision.replied).toBe(0)
    expect(original.members.every((member) => member.choice === null)).toBe(true)
  })
  it('distinguishes review requests, real agreement and confirmed consumption', () => {
    const choice = publication()
    choice.members[0].choice = 'another'
    expect(mealDecision(choice).status).toBe('Another suggestion requested')
    choice.members[0].choice = 'agree'
    expect(mealDecision(choice).status).toBe('Meal chosen')
    choice.members[1].choice = 'agree'
    expect(mealDecision(choice).status).toBe('Everyone’s happy')
    choice.eatenAt = '2026-10-24T12:00:00Z'
    expect(mealDecision(choice).status).toBe('Recorded as eaten')
  })
  it('keeps lunch and dinner independent and ignores replaced choices', () => {
    const entries = familyMeals([
      widget([
        publication({ id: 'old', current: false }),
        publication({ id: 'dinner', mealType: 'dinner' }),
        publication({ id: 'lunch' }),
      ]),
    ])
    expect(entries.map((entry) => entry.publication.id)).toEqual(['lunch', 'dinner'])
    expect(mealLink(entries[1])).toBe('/my-space?view=family&widget=42&meal=dinner')
  })
  it('returns exactly seven calendar days across the October clock change, excluding older and future meals', () => {
    const entries = familyMeals([
      widget([
        publication({ id: 'today', forDate: '2026-10-27' }),
        publication({ id: 'oldest', forDate: '2026-10-21' }),
        publication({ id: 'too-old', forDate: '2026-10-20' }),
        publication({ id: 'future', forDate: '2026-10-28' }),
      ]),
    ])
    const days = diaryDays(entries, new Date(2026, 9, 27, 12).getTime())
    expect(days.map((day) => day.date)).toEqual([
      '2026-10-27',
      '2026-10-26',
      '2026-10-25',
      '2026-10-24',
      '2026-10-23',
      '2026-10-22',
      '2026-10-21',
    ])
    expect(days.flatMap((day) => day.meals).map((entry) => entry.publication.id)).toEqual([
      'today',
      'oldest',
    ])
    expect(diaryDays([], new Date(2026, 9, 27, 12).getTime())).toHaveLength(7)
  })
  it('rewards logged days rather than repeat spins, multiple meals or duplicate installations', () => {
    const today = new Date(2026, 9, 24, 12).getTime()
    const sameDay = familyMeals([
      widget([
        publication({ id: 'lunch', eatenAt: '2026-10-24T12:00:00Z' }),
        publication({ id: 'dinner', mealType: 'dinner', eatenAt: '2026-10-24T18:00:00Z' }),
      ]),
    ])
    expect(mealMilestone(diaryDays(sameDay, today)).loggedDays).toBe(1)
    expect(mealMilestone(diaryDays([...sameDay, ...sameDay], today)).loggedDays).toBe(1)
    sameDay.forEach((entry) => (entry.publication.eatenAt = null))
    expect(mealMilestone(diaryDays(sameDay, today)).loggedDays).toBe(0)
    const seven = familyMeals([
      widget(
        Array.from({ length: 7 }, (_, i) =>
          publication({
            id: String(i),
            forDate: '2026-10-' + (24 - i),
            eatenAt: '2026-10-24T18:00:00Z',
          }),
        ),
      ),
    ])
    const milestone = mealMilestone(diaryDays(seven, today))
    expect(milestone.loggedDays).toBe(7)
    expect(milestone.progress).toBe(3)
    expect(milestone.title).toContain('full week')
  })
})
