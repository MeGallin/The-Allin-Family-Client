import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { Provider } from 'react-redux'
import { createAppStore } from '../../app/store'
import { userReceived } from '../auth/auth-slice'
import { DraftProtectionProvider } from '../drafts/DraftProtection'
import type { FamilyUser } from '../../types/auth'
import type { AdvertAdmin, AdvertPayload, AdvertRecord, AdvertSnapshot } from './types'
import advertising, { advertSnapshotReceived } from './advertising-slice'
import { advertDestinations } from './destinations'
import { AdvertCard } from '../../components/advertising/AdvertCard'
import AdminAdvertising from '../../components/admin/advertising/AdminAdvertising'

const api = vi.hoisted(() => ({
  getAdvertAdmin: vi.fn(),
  mutateAdvertising: vi.fn(),
  getAdvertCredentials: vi.fn(),
}))
vi.mock('../../services/advertising-api', () => api)
const admin: FamilyUser = {
  id: 42,
  username: 'synthetic-admin',
  displayName: 'Fixture Dad',
  familyName: 'Dad',
  nickname: 'Dad',
  role: 'admin',
  profileVersion: 1,
  mustChangePassword: false,
}
const payload: AdvertPayload = {
  featureId: 'shopping',
  ctaId: 'shopping',
  format: 'headline',
  headline: 'A little room for everyday essentials',
  message: 'Keep the family list handy.',
  scenario: 'Imagine noticing the last tea bag.',
  items: [],
  factIds: ['fact-1'],
}
const record: AdvertRecord = {
  id: 'synthetic-ad-a',
  payload,
  featureHash: 'known-reference',
  configRevision: 1,
  preparedAt: 1,
  approved: true,
  promotedAt: 1,
  validUntil: null,
}

function snapshot(): AdvertAdmin {
  return {
    version: 1,
    configRevision: 1,
    draftVersion: 1,
    current: null,
    candidate: null,
    working: false,
    provider: 'openai',
    credentials: { bridgeConfigured: true },
    nextEligibleAt: null,
    retryAt: 0,
    lastOutcome: 'disabled',
    usage: {},
    audit: [],
    excludedProposals: ['quiz'],
    models: {
      'gpt-6-luna': {
        efforts: ['none', 'low', 'medium'],
        inputPrice: 100000,
        outputPrice: 500000,
        priceCheckedAt: '2026-11-17',
      },
    },
    config: {
      enabled: false,
      paused: false,
      manualApproval: true,
      brand: { name: 'The Allin Family', tone: 'Quiet British English', exclusions: [] },
      formats: ['headline', 'checklist', 'process', 'comparison'],
      limits: { headline: 80, message: 240, item: 180, maxItems: 4 },
      schedule: {
        mode: 'daily',
        intervalSeconds: 86400,
        dailyAt: '09:00',
        timezone: 'Europe/London',
        windowStart: '00:00',
        windowEnd: '23:59',
        idlePolicy: 'keep',
        idleSeconds: 86400,
        preparationLeadSeconds: 3600,
      },
      generation: {
        provider: 'openai',
        model: 'gpt-6-luna',
        effort: 'low',
        maxOutputTokens: 512,
        timeoutSeconds: 30,
        retries: 1,
        backoffSeconds: 30,
      },
      review: { enabled: false, model: 'gpt-6-luna', effort: 'low', maxOutputTokens: 256 },
      image: {
        layouts: ['poster', 'split', 'image-led'],
        maxHeadlineWords: 5,
        enabled: false,
        model: 'gpt-image-2.6-flare',
        quality: 'medium',
        complexity: 'medium',
        size: '1536x1024',
        timeoutSeconds: 120,
        promptStyle: 'Editorial campaign artwork',
        maxPromptCharacters: 1200,
        reservationMicros: 2000000,
      },
      budget: {
        dailyImages: 0,
        monthlyImages: 0,
        dailyMicros: 0,
        monthlyMicros: 0,
        dailyCalls: 0,
        monthlyCalls: 0,
        dailyTokens: 0,
        monthlyTokens: 0,
      },
      prices: {
        checkedAt: '2026-11-17',
        validDays: 30,
        models: { 'gpt-6-luna': { input: 100000, output: 500000 } },
      },
      features: [
        {
          id: 'shopping',
          ctaId: 'shopping',
          title: 'Shopping List',
          enabled: true,
          weight: 1,
          expiresAt: null,
          facts: [
            { id: 'fact-1', text: 'One shared list.' },
            { id: 'fact-2', text: 'Check picked-up items.' },
          ],
          exclusions: [],
        },
      ],
    },
    draft: null as unknown as AdvertAdmin['draft'],
  }
}
function fixture() {
  const value = snapshot()
  value.draft = structuredClone(value.config)
  return value
}
function mount(user = admin) {
  const store = createAppStore()
  store.dispatch(userReceived(user))
  const router = createMemoryRouter(
    [
      {
        path: '*',
        element: (
          <Provider store={store}>
            <DraftProtectionProvider>
              <AdminAdvertising />
            </DraftProtectionProvider>
          </Provider>
        ),
      },
    ],
    { initialEntries: ['/admin?view=advertising'] },
  )
  render(<RouterProvider router={router} />)
  return { store, router }
}
beforeEach(() => {
  api.getAdvertAdmin.mockResolvedValue(fixture())
  api.mutateAdvertising.mockReset()
})

describe('advertising session cache and controlled formats', () => {
  it('follows publications, clears on session changes and suppresses invalid references', () => {
    let state = advertising(undefined, userReceived(admin))
    const first: AdvertSnapshot = {
      enabled: true,
      current: record,
      references: { shopping: 'known-reference' },
      serverTime: 1,
    }
    state = advertising(state, advertSnapshotReceived({ ownerId: admin.id, snapshot: first }))
    state = advertising(
      state,
      advertSnapshotReceived({
        ownerId: admin.id,
        snapshot: { ...first, current: { ...record, id: 'new-b' } },
      }),
    )
    expect(state.current?.id).toBe('new-b')
    state = advertising(
      state,
      advertSnapshotReceived({ ownerId: admin.id, snapshot: { ...first, references: {} } }),
    )
    expect(state.current).toBeNull()
    state = advertising(state, userReceived(null))
    expect(state.version).toBe(-1)
    state = advertising(state, userReceived({ ...admin, id: 99 }))
    expect(state.current).toBeNull()
    state = advertising(state, advertSnapshotReceived({ ownerId: 42, snapshot: first }))
    expect(state.current).toBeNull()
  })
  it.each(['headline', 'checklist', 'process', 'comparison'] as const)(
    'renders %s as text with a labelled hypothetical scenario',
    (format) => {
      const { container } = render(
        <AdvertCard
          payload={{
            ...payload,
            format,
            items: format === 'headline' ? [] : ['One possibility', 'Another possibility'],
          }}
        />,
      )
      expect(screen.getByRole('heading', { name: payload.headline })).toBeTruthy()
      expect(screen.getByText('Imagine this · illustrative scenario')).toBeTruthy()
      expect(container.querySelector('[style],style')).toBeNull()
      expect(
        container.querySelectorAll(
          format === 'process'
            ? 'ol li'
            : format === 'checklist'
              ? 'ul li'
              : '.advert-card__comparison p',
        ).length,
      ).toBe(format === 'headline' ? 0 : 2)
    },
  )
  it('uses only approved same-site destinations without action or installation parameters', () => {
    expect(Object.keys(advertDestinations)).toHaveLength(15)
    for (const { path, shortLabel } of Object.values(advertDestinations)) {
      expect(shortLabel.split(' ')).toHaveLength(2)
      expect(path.startsWith('/')).toBe(true)
      expect(path).not.toMatch(/install|compose|remove|https?:|\/\//)
    }
    expect(advertDestinations.nonograms.path).toContain('details=nonograms')
    expect(advertDestinations.week.path).toBe('/profile?view=weather')
  })
})

describe('administrator configuration draft', () => {
  it('does not load or render controls for a member', async () => {
    mount({ ...admin, role: 'member' })
    expect(api.getAdvertAdmin).not.toHaveBeenCalled()
    expect(screen.queryByRole('heading', { name: 'Feature advertising' })).toBeNull()
  })
  it('has real labelled controls, preserves a rejected draft and blocks leaving a dirty editor', async () => {
    const { router } = mount()
    const brand = await screen.findByLabelText('Brand name')
    fireEvent.change(brand, { target: { value: 'Synthetic edited brand' } })
    expect((brand as HTMLInputElement).value).toBe('Synthetic edited brand')
    api.mutateAdvertising.mockRejectedValue(new Error('Changed elsewhere'))
    fireEvent.submit(
      screen.getByRole('button', { name: 'Save configuration draft' }).closest('form')!,
    )
    await screen.findByRole('alert')
    expect((screen.getByLabelText('Brand name') as HTMLInputElement).value).toBe(
      'Synthetic edited brand',
    )
    expect(api.mutateAdvertising.mock.calls[0][0]).toMatchObject({
      action: 'save-draft',
      version: 1,
      draftVersion: 1,
    })
    void router.navigate('/admin?view=members')
    await screen.findByRole('heading', { name: 'Discard unsaved changes?' })
    fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }))
    await waitFor(() => expect(router.state.location.search).toContain('advertising'))
    expect(screen.getByLabelText('Daily budget, USD')).toBeTruthy()
    expect(screen.getByLabelText('generation reasoning')).toBeTruthy()
    expect(screen.getByLabelText('Require manual approval for each candidate')).toBeTruthy()
  })
  it('saves with CAS before separate apply and shows USD decimal budgets', async () => {
    mount()
    const initial = await screen.findByLabelText('Brand name')
    const updated = fixture()
    updated.version = 2
    updated.draftVersion = 2
    updated.draft.brand.name = 'Saved synthetic brand'
    api.mutateAdvertising.mockResolvedValue(updated)
    fireEvent.change(initial, { target: { value: 'Saved synthetic brand' } })
    fireEvent.change(screen.getByLabelText('Daily budget, USD'), { target: { value: '0.02' } })
    fireEvent.submit(
      screen.getByRole('button', { name: 'Save configuration draft' }).closest('form')!,
    )
    await screen.findByRole('status')
    expect(api.mutateAdvertising.mock.calls[0][0].config.budget.dailyMicros).toBe(20000)
    expect(
      (screen.getByRole('button', { name: 'Apply saved settings' }) as HTMLButtonElement).disabled,
    ).toBe(false)
    expect(api.mutateAdvertising.mock.calls).toHaveLength(1)
  })
  it('preserves multiline editing and saves cleared exclusions as empty arrays', async () => {
    const initial = fixture()
    initial.draft.brand.exclusions = ['Original brand rule']
    initial.draft.features[0].exclusions = ['Original feature rule']
    api.getAdvertAdmin.mockResolvedValue(initial)
    api.mutateAdvertising.mockResolvedValue(fixture())
    mount()
    const brand = await screen.findByLabelText(/^Copy exclusions/)
    fireEvent.change(brand, { target: { value: 'First rule\n\nSecond rule\n' } })
    expect((brand as HTMLTextAreaElement).value).toBe('First rule\n\nSecond rule\n')
    fireEvent.change(brand, { target: { value: '' } })
    fireEvent.change(screen.getByLabelText(/^Shopping List copy exclusions/), {
      target: { value: ' \n\n' },
    })
    fireEvent.submit(
      screen.getByRole('button', { name: 'Save configuration draft' }).closest('form')!,
    )
    await screen.findByRole('status')
    const sent = api.mutateAdvertising.mock.calls[0][0].config
    expect(sent.brand.exclusions).toEqual([])
    expect(sent.features[0].exclusions).toEqual([])
  })
})

it('saves configurable runtime image choices and count caps through the existing draft CAS', async () => {
  mount()
  await screen.findByLabelText('Generate artwork for new adverts')
  fireEvent.click(screen.getByLabelText('Generate artwork for new adverts'))
  fireEvent.click(screen.getByLabelText('Poster · bold type above the hero'))
  fireEvent.change(screen.getByLabelText('Maximum headline words'), { target: { value: '4' } })
  fireEvent.change(screen.getByLabelText('Image model'), {
    target: { value: 'gpt-image-2.6-sunburst' },
  })
  fireEvent.change(screen.getByLabelText('Visual planning complexity'), {
    target: { value: 'high' },
  })
  fireEvent.change(screen.getByLabelText('Estimated reservation per image, USD'), {
    target: { value: '3.25' },
  })
  fireEvent.change(screen.getByLabelText('daily Images'), { target: { value: '2' } })
  fireEvent.change(screen.getByLabelText('monthly Images'), { target: { value: '5' } })
  api.mutateAdvertising.mockResolvedValue(fixture())
  fireEvent.submit(
    screen.getByRole('button', { name: 'Save configuration draft' }).closest('form')!,
  )
  await screen.findByRole('status')
  expect(api.mutateAdvertising.mock.calls[0][0].config).toMatchObject({
    image: {
      layouts: ['split', 'image-led'],
      maxHeadlineWords: 4,
      enabled: true,
      model: 'gpt-image-2.6-sunburst',
      complexity: 'high',
      reservationMicros: 3250000,
    },
    budget: { dailyImages: 2, monthlyImages: 5 },
  })
})

it.each([
  [0.5, 30],
  [3, 180],
])(
  'saves %s minutes as %s seconds without changing daily time or timezone',
  async (minutes, seconds) => {
    mount()
    const schedule = await screen.findByLabelText('Schedule')
    fireEvent.change(schedule, { target: { value: 'interval' } })
    const interval = screen.getByLabelText('Interval in minutes (30 seconds–31 days)')
    fireEvent.change(interval, { target: { value: String(minutes) } })
    fireEvent.change(screen.getByLabelText('Interval units'), { target: { value: 'seconds' } })
    expect(
      (screen.getByLabelText('Interval in seconds (30 seconds–31 days)') as HTMLInputElement).value,
    ).toBe(String(seconds))
    fireEvent.change(screen.getByLabelText('Interval units'), { target: { value: 'minutes' } })
    expect(
      (screen.getByLabelText('Interval in minutes (30 seconds–31 days)') as HTMLInputElement).value,
    ).toBe(String(minutes))
    api.mutateAdvertising.mockResolvedValue(fixture())
    fireEvent.submit(
      screen.getByRole('button', { name: 'Save configuration draft' }).closest('form')!,
    )
    await screen.findByRole('status')
    expect(api.mutateAdvertising.mock.calls[0][0].config.schedule).toMatchObject({
      mode: 'interval',
      intervalSeconds: seconds,
      dailyAt: '09:00',
      timezone: 'Europe/London',
    })
  },
)
