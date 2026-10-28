import { act, render, renderHook, screen, waitFor, within } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router'
import { afterEach, expect, it, vi } from 'vitest'
import { createAppStore } from '../../app/store'
import { clearPrivateState } from '../../app/session-actions'
import { userReceived } from '../../features/auth/auth-slice'
import { removalScheduled } from '../../features/removals/removals-slice'
import { useHomeOverview } from '../../features/family/useHomeOverview'
import { widgetsApi } from '../../services/widgets-query'
import { jobsApi } from '../../services/household-jobs-query'
import { shoppingApi } from '../../services/shopping-query'
import { memoriesApi } from '../../services/memories-query'
import { pollsApi } from '../../services/polls-query'
import { testUser } from '../../test/fixtures'
import type { FamilyWidget, DinnerPublication } from '../../features/widgets/types'
import type { HouseholdJob } from '../../features/household-jobs/types'
import { HomeOverview } from './HomeOverview'

const now = Date.parse('2026-10-28T12:00:00Z')
vi.mock('../../hooks/useNow', () => ({ useNow: () => Date.parse('2026-10-28T12:00:00Z') }))
const calendar = { dayCount: 7, visiblePlans: 2, upcomingPlans: 4, loading: false, error: false }
let store: ReturnType<typeof createAppStore> | undefined
afterEach(() => {
  if (store) act(() => clearPrivateState(store!.dispatch))
  store = undefined
})

it('renders reusable linked summaries without requiring family state, preserving zero and unavailable states', () => {
  render(
    <MemoryRouter>
      <HomeOverview
        entries={[
          {
            kind: 'plans',
            to: '/calendar',
            label: 'Plans · next 7 days',
            count: 0,
            detail: '4 upcoming in calendar',
          },
          {
            kind: 'polls',
            to: '/my-space?view=family&tool=polls',
            label: 'Open polls',
            count: null,
            status: 'Loading…',
          },
          {
            kind: 'shopping',
            to: '/my-space?view=family&tool=shopping',
            label: 'To pick up',
            count: 3,
            detail: '1 important',
            status: 'Refresh unavailable',
          },
        ]}
      />
    </MemoryRouter>,
  )
  const overview = screen.getByRole('navigation', { name: 'Family at a glance' })
  expect(within(overview).getAllByRole('link')).toHaveLength(3)
  expect(
    within(overview)
      .getByRole('link', { name: /0.*Plans.*4 upcoming/ })
      .getAttribute('href'),
  ).toBe('/calendar')
  expect(
    within(overview).getByRole('link', { name: /Open polls.*Loading/ }).textContent,
  ).not.toContain('0')
  expect(
    within(overview)
      .getByRole('link', { name: /3.*To pick up.*Refresh unavailable/ })
      .getAttribute('href'),
  ).toContain('tool=shopping')
})

function publication(
  id: string,
  forDate = '2026-10-28',
  extra: Partial<DinnerPublication> = {},
): DinnerPublication {
  return {
    id,
    spinId: id,
    meal: 'Published meal',
    mealType: 'dinner',
    current: true,
    eatenAt: null,
    eatenBy: null,
    forDate,
    publishedAt: new Date(now).toISOString(),
    publisher: { id: testUser.id, name: 'Dad' },
    members: [],
    ...extra,
  }
}
function widget(id: string, extra: Partial<FamilyWidget> = {}): FamilyWidget {
  return {
    id,
    kind: 'dinner-spinner',
    title: 'Meals',
    visibility: 'family',
    owner: { id: testUser.id, name: 'Dad' },
    version: 1,
    hidden: false,
    createdAt: new Date(now).toISOString(),
    updatedAt: new Date(now).toISOString(),
    meals: [],
    spins: [],
    publications: [publication(id)],
    ...extra,
  }
}
function job(id: string, extra: Partial<HouseholdJob> = {}): HouseholdJob {
  return {
    id,
    ownerId: testUser.id,
    scope: 'family',
    title: 'Job',
    note: '',
    area: '',
    targetDate: null,
    repeat: 'none',
    assigneeId: null,
    done: false,
    version: 1,
    history: [],
    ...extra,
  }
}

it.each([
  {
    scenario: 'past-only diary',
    widgets: [
      widget('older', { publications: [publication('older', '2026-10-26')] }),
      widget('recent', { publications: [publication('recent', '2026-10-27')] }),
    ],
    destination: '/my-space?view=family&widget=recent&meal=recent',
  },
  {
    scenario: 'upcoming publication',
    widgets: [
      widget('later', { publications: [publication('later', '2026-11-01')] }),
      widget('soon', { publications: [publication('soon', '2026-10-29')] }),
      widget('past', { publications: [publication('past', '2026-10-27')] }),
    ],
    destination: '/my-space?view=family&widget=soon&meal=soon',
  },
  {
    scenario: 'installation without publications',
    widgets: [widget('empty', { publications: [] })],
    destination: '/my-space?view=family&widget=empty',
  },
  {
    scenario: 'no eligible installation',
    widgets: [],
    destination: '/my-space?view=library',
  },
])(
  'routes meal summary to its $scenario source, excluding ineligible installations',
  async ({ widgets, destination }) => {
    store = createAppStore()
    store.dispatch(userReceived(testUser))
    store.dispatch(
      removalScheduled({
        key: 'widgets:queued',
        domain: 'widgets',
        item: { id: 'queued', title: 'Meals', version: 1 },
        token: 'test-removal',
        deadline: Date.now() + 20_000,
        sending: false,
        ownerId: testUser.id,
        generation: store.getState().auth.generation,
      }),
    )
    await store.dispatch(
      widgetsApi.util.upsertQueryData('getWidgets', testUser.id, {
        ownerId: testUser.id,
        widgets: [
          widget('private', { visibility: 'private' }),
          widget('hidden', { hidden: true }),
          widget('queued'),
          ...widgets,
        ],
      }),
    )
    const { result } = renderHook(() => useHomeOverview(calendar), {
      wrapper: ({ children }) => <Provider store={store!}>{children}</Provider>,
    })
    expect(result.current.find((entry) => entry.kind === 'meals')?.to).toBe(destination)
    expect(fetch).not.toHaveBeenCalled()
  },
)

it('derives family-only meal and job summaries from existing owner-scoped caches without a request', async () => {
  store = createAppStore()
  store.dispatch(userReceived(testUser))
  await store.dispatch(
    widgetsApi.util.upsertQueryData('getWidgets', testUser.id, {
      ownerId: testUser.id,
      widgets: [
        widget('today'),
        widget('past', {
          publications: [publication('past', '2026-10-27', { eatenAt: '2026-10-27T18:00:00Z' })],
        }),
        widget('private', { visibility: 'private' }),
        widget('hidden', { hidden: true }),
        widget('old', { publications: [publication('old', '2026-10-20')] }),
        widget('replaced', {
          publications: [publication('replaced', '2026-10-28', { current: false })],
        }),
      ],
    }),
  )
  await store.dispatch(
    jobsApi.util.upsertQueryData('getJobs', testUser.id, {
      ownerId: testUser.id,
      jobs: [
        job('open'),
        job('today', { targetDate: '2026-10-28' }),
        job('done', { done: true }),
        job('private', { scope: 'mine' }),
      ],
      archive: [],
      members: [],
    }),
  )
  const { result } = renderHook(() => useHomeOverview(calendar), {
    wrapper: ({ children }) => <Provider store={store!}>{children}</Provider>,
  })
  expect(result.current.find((entry) => entry.kind === 'plans')).toMatchObject({
    count: 2,
    detail: '4 upcoming in calendar',
  })
  expect(result.current.find((entry) => entry.kind === 'meals')).toMatchObject({
    count: 2,
    detail: '1 eaten · 1 upcoming',
  })
  expect(result.current.find((entry) => entry.kind === 'jobs')).toMatchObject({
    count: 2,
    detail: '1 planned today',
  })
  expect(fetch).not.toHaveBeenCalled()
  act(() => store!.dispatch(userReceived({ ...testUser, id: testUser.id + 1 })))
  expect(result.current.find((entry) => entry.kind === 'meals')?.count).toBeNull()
  expect(result.current.find((entry) => entry.kind === 'jobs')?.count).toBeNull()
})

it('distinguishes missing snapshots, loaded empty collections and offline saved summaries', async () => {
  store = createAppStore()
  store.dispatch(userReceived(testUser))
  const { result, unmount } = renderHook(() => useHomeOverview(calendar), {
    wrapper: ({ children }) => <Provider store={store!}>{children}</Provider>,
  })
  expect(result.current.find((entry) => entry.kind === 'shopping')).toMatchObject({
    count: null,
    status: 'Loading…',
  })
  await act(async () => {
    await store!.dispatch(
      shoppingApi.util.upsertQueryData('getShopping', undefined, { items: [], activity: [] }),
    )
    await store!.dispatch(
      memoriesApi.util.upsertQueryData('getMemories', undefined, { memories: [], activity: [] }),
    )
    await store!.dispatch(pollsApi.util.upsertQueryData('getPolls', undefined, { polls: [] }))
  })
  await waitFor(() =>
    expect(result.current.find((entry) => entry.kind === 'shopping')).toMatchObject({
      count: 0,
      detail: 'All caught up',
      status: undefined,
    }),
  )
  expect(result.current.find((entry) => entry.kind === 'memories')).toMatchObject({
    count: 0,
    detail: '0 with photos',
    status: undefined,
  })
  expect(result.current.find((entry) => entry.kind === 'polls')).toMatchObject({
    count: 0,
    label: 'Open polls',
    status: undefined,
  })
  unmount()
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
  const offline = renderHook(() => useHomeOverview(calendar), {
    wrapper: ({ children }) => <Provider store={store!}>{children}</Provider>,
  })
  expect(offline.result.current.find((entry) => entry.kind === 'shopping')).toMatchObject({
    count: 0,
    status: 'Offline · saved summary',
  })
  expect(offline.result.current.find((entry) => entry.kind === 'jobs')).toMatchObject({
    count: null,
    status: 'Offline',
  })
  expect(fetch).not.toHaveBeenCalled()
})
