import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { createAppStore, type AppStore } from '../../app/store'
import { userReceived } from '../../features/auth/auth-slice'
import type { AdvertRecord, AdvertSnapshot } from '../../features/advertising/types'
import { HomeSpotlight } from './HomeSpotlight'
import { ApiError } from '../../services/api-client'
import { clearAdvertImage } from '../../features/advertising/image-cache'
const api = vi.hoisted(() => ({
  getAdvertSnapshot: vi.fn(),
  getAdvertImage: vi.fn(),
  prepareAdvertImage: vi.fn(),
}))
vi.mock('../../services/advertising-api', () => api)
vi.mock('../../features/advertising/prepare-image', () => ({
  prepareAdvertImage: api.prepareAdvertImage,
}))
const current: AdvertRecord = {
  id: 'synthetic-a',
  featureHash: 'known-shopping',
  configRevision: 1,
  preparedAt: 1,
  approved: true,
  promotedAt: 1,
  validUntil: null,
  payload: {
    featureId: 'shopping',
    ctaId: 'shopping',
    format: 'headline',
    headline: 'A gentle reminder for the family list',
    message: 'Keep the essentials together.',
    scenario: 'Imagine noticing an empty cupboard.',
    items: [],
    factIds: ['fact-1'],
  },
}
const snapshot = (): AdvertSnapshot => ({
  version: 1,
  enabled: true,
  current,
  references: { shopping: 'known-shopping' },
  serverTime: Math.floor(Date.now() / 1000),
})
function mount(store?: AppStore) {
  store ??= createAppStore()
  if (!store.getState().auth.user)
    store.dispatch(
      userReceived({
        id: 42,
        username: 'fixture-dad',
        familyName: 'Dad',
        displayName: 'Fixture Dad',
        nickname: 'Dad',
        role: 'admin',
        profileVersion: 1,
        mustChangePassword: false,
      }),
    )
  const router = createMemoryRouter([
    {
      path: '*',
      element: (
        <Provider store={store}>
          <HomeSpotlight />
        </Provider>
      ),
    },
  ])
  return { ...render(<RouterProvider router={router} />), store, router }
}
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  clearAdvertImage()
})
beforeEach(() => {
  vi.stubGlobal('URL', Object.assign(URL, { revokeObjectURL: vi.fn() }))
  api.prepareAdvertImage.mockReset().mockResolvedValue('blob:campaign-ready')
  api.getAdvertImage.mockRejectedValue(new Error('Image not present in synthetic test'))
  api.getAdvertSnapshot.mockReset()
  api.getAdvertSnapshot.mockResolvedValue(snapshot())
})
it('renders an authenticated snapshot and follows B across a Home remount', async () => {
  const first = mount()
  await screen.findByRole('heading', { name: current.payload.headline })
  first.unmount()
  api.getAdvertSnapshot.mockResolvedValue({
    ...snapshot(),
    current: {
      ...current,
      id: 'synthetic-b',
      payload: { ...current.payload, headline: 'Successor B' },
    },
  })
  mount(first.store)
  await waitFor(() => expect(api.getAdvertSnapshot).toHaveBeenCalledTimes(2))
  await screen.findByRole('heading', { name: 'Successor B' })
  expect(screen.queryByRole('heading', { name: current.payload.headline })).toBeNull()
})
it('rechecks reference safety on CTA, suppressing disabled copy without navigation', async () => {
  const { router } = mount()
  const button = await screen.findByRole('button', { name: 'Explore Shopping List' })
  api.getAdvertSnapshot.mockResolvedValue({
    ...snapshot(),
    enabled: false,
    references: {},
    current: null,
  })
  fireEvent.click(button)
  await waitFor(() =>
    expect(screen.queryByRole('heading', { name: current.payload.headline })).toBeNull(),
  )
  expect(router.state.location.pathname).toBe('/')
})
it('navigates a valid CTA to the approved family tool after a fresh safety check', async () => {
  const { router } = mount()
  fireEvent.click(await screen.findByRole('button', { name: 'Explore Shopping List' }))
  await waitFor(() =>
    expect(router.state.location.pathname + router.state.location.search).toBe(
      '/my-space?view=family&tool=shopping',
    ),
  )
  expect(api.getAdvertSnapshot).toHaveBeenCalledTimes(2)
})
it('hides an expired cached advert without requesting a replacement or provider work', async () => {
  api.getAdvertSnapshot.mockResolvedValue({
    ...snapshot(),
    current: { ...current, validUntil: Math.floor(Date.now() / 1000) - 1 },
  })
  mount()
  await waitFor(() => expect(api.getAdvertSnapshot).toHaveBeenCalledOnce())
  expect(screen.queryByRole('heading', { name: current.payload.headline })).toBeNull()
})
it('focus follows authoritative publication and suppresses changed references', async () => {
  mount()
  await screen.findByRole('heading', { name: current.payload.headline })
  await waitFor(() => expect(api.getAdvertSnapshot).toHaveBeenCalledOnce())
  api.getAdvertSnapshot.mockResolvedValue({ ...snapshot(), current: { ...current, id: 'b' } })
  fireEvent.focus(window)
  await waitFor(() => expect(api.getAdvertSnapshot).toHaveBeenCalledTimes(2))
  expect(screen.getByRole('heading', { name: current.payload.headline })).toBeTruthy()
  api.getAdvertSnapshot.mockResolvedValue({
    ...snapshot(),
    references: { shopping: 'changed-facts' },
  })
  fireEvent.focus(window)
  await waitFor(() =>
    expect(screen.queryByRole('heading', { name: current.payload.headline })).toBeNull(),
  )
})

it('uses the short image-campaign CTA and still performs the safe route check', async () => {
  api.getAdvertSnapshot.mockResolvedValue({
    ...snapshot(),
    current: {
      ...current,
      image: { id: 'a'.repeat(48), width: 1024, height: 1024, bytes: 4, mime: 'image/jpeg' },
      payload: { ...current.payload, composition: 'split', headline: 'Keep everyone in sync' },
    },
  })
  const { router } = mount()
  fireEvent.click(await screen.findByRole('button', { name: 'Open list' }))
  await waitFor(() =>
    expect(router.state.location.pathname + router.state.location.search).toBe(
      '/my-space?view=family&tool=shopping',
    ),
  )
  expect(api.getAdvertSnapshot).toHaveBeenCalledTimes(2)
})

function imageSnapshot(version: number, name: string): AdvertSnapshot {
  return {
    ...snapshot(),
    version,
    current: {
      ...current,
      id: name,
      payload: { ...current.payload, headline: name },
      image: {
        id: name.toLowerCase().repeat(48),
        width: 1024,
        height: 1024,
        bytes: 4,
        mime: 'image/jpeg',
      },
    },
  }
}
it('navigates eligible A without fetching newly published B artwork', async () => {
  api.getAdvertSnapshot.mockResolvedValue(imageSnapshot(1, 'A'))
  api.prepareAdvertImage.mockResolvedValueOnce('blob:a')
  const { router } = mount()
  await screen.findByRole('heading', { name: 'A' })
  api.getAdvertSnapshot.mockResolvedValue(imageSnapshot(2, 'B'))
  api.prepareAdvertImage.mockRejectedValue(new Error('B image unavailable'))
  fireEvent.click(screen.getByRole('button', { name: 'Open list' }))
  await waitFor(() => expect(router.state.location.search).toBe('?view=family&tool=shopping'))
  expect(api.prepareAdvertImage).toHaveBeenCalledTimes(1)
})
it.each(['invalid-reference', 'unauthorized'] as const)(
  'blocks A CTA after %s',
  async (failure) => {
    api.getAdvertSnapshot.mockResolvedValue(imageSnapshot(1, 'A'))
    const { router } = mount()
    await screen.findByRole('heading', { name: 'A' })
    if (failure === 'unauthorized')
      api.getAdvertSnapshot.mockRejectedValue(new ApiError('Session ended', 401, 'unauthenticated'))
    else api.getAdvertSnapshot.mockResolvedValue({ ...imageSnapshot(2, 'B'), references: {} })
    fireEvent.click(screen.getByRole('button', { name: 'Open list' }))
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'A' })).toBeNull())
    expect(router.state.location.pathname).toBe('/')
  },
)
it('keeps complete A while B artwork loads, then atomically replaces copy/image and revokes A', async () => {
  api.getAdvertSnapshot.mockResolvedValue(imageSnapshot(1, 'A'))
  api.prepareAdvertImage.mockResolvedValueOnce('blob:a')
  const view = mount()
  await screen.findByRole('heading', { name: 'A' })
  let ready!: (url: string) => void
  api.prepareAdvertImage.mockImplementationOnce(
    () =>
      new Promise<string>((resolve) => {
        ready = resolve
      }),
  )
  api.getAdvertSnapshot.mockResolvedValue(imageSnapshot(2, 'B'))
  fireEvent.focus(window)
  await waitFor(() => expect(api.prepareAdvertImage).toHaveBeenCalledTimes(2))
  expect(screen.getByRole('heading', { name: 'A' })).toBeTruthy()
  expect(view.container.querySelector('img')?.getAttribute('src')).toBe('blob:a')
  expect(URL.revokeObjectURL).not.toHaveBeenCalledWith('blob:a')
  await act(async () => {
    ready('blob:b')
    await Promise.resolve()
  })
  await screen.findByRole('heading', { name: 'B' })
  expect(screen.queryByRole('heading', { name: 'A' })).toBeNull()
  expect(view.container.querySelector('img')?.getAttribute('src')).toBe('blob:b')
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:a')
})
it('allows A navigation while an earlier B decoder is stalled and discards its late result', async () => {
  api.getAdvertSnapshot.mockResolvedValue(imageSnapshot(1, 'A'))
  const view = mount()
  await screen.findByRole('heading', { name: 'A' })
  let ready!: (url: string) => void
  api.prepareAdvertImage.mockImplementationOnce(
    () =>
      new Promise<string>((resolve) => {
        ready = resolve
      }),
  )
  api.getAdvertSnapshot.mockResolvedValue(imageSnapshot(2, 'B'))
  fireEvent.focus(window)
  await waitFor(() => expect(api.prepareAdvertImage).toHaveBeenCalledTimes(2))
  fireEvent.click(screen.getByRole('button', { name: 'Open list' }))
  await waitFor(() => expect(view.router.state.location.search).toBe('?view=family&tool=shopping'))
  await act(async () => {
    ready('blob:late-b')
    await Promise.resolve()
  })
  expect(view.store.getState().advertising.current?.id).toBe('A')
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:late-b')
})
it.each(['logout', 'account-change'] as const)(
  'rejects pending CTA metadata across %s',
  async (boundary) => {
    api.getAdvertSnapshot.mockResolvedValue(imageSnapshot(1, 'A'))
    const view = mount()
    await screen.findByRole('heading', { name: 'A' })
    let ready!: (value: AdvertSnapshot) => void
    api.getAdvertSnapshot.mockImplementationOnce(
      () =>
        new Promise<AdvertSnapshot>((resolve) => {
          ready = resolve
        }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Open list' }))
    const user = view.store.getState().auth.user!
    act(() => view.store.dispatch(userReceived(boundary === 'logout' ? null : { ...user, id: 99 })))
    await act(async () => {
      ready(imageSnapshot(2, 'B'))
      await Promise.resolve()
    })
    expect(view.router.state.location.pathname).toBe('/')
    expect(view.store.getState().advertising.current?.id).not.toBe('B')
  },
)
it('does not navigate on a stale CTA snapshot', async () => {
  api.getAdvertSnapshot.mockResolvedValue(imageSnapshot(3, 'A'))
  const view = mount()
  await screen.findByRole('heading', { name: 'A' })
  api.getAdvertSnapshot.mockResolvedValue(imageSnapshot(2, 'B'))
  fireEvent.click(screen.getByRole('button', { name: 'Open list' }))
  await waitFor(() => expect(api.getAdvertSnapshot).toHaveBeenCalledTimes(2))
  await act(async () => {
    await Promise.resolve()
  })
  expect(view.router.state.location.pathname).toBe('/')
})
it('does not navigate when A expires during its metadata check', async () => {
  const now = Date.now()
  api.getAdvertSnapshot.mockResolvedValue({
    ...imageSnapshot(1, 'A'),
    current: { ...imageSnapshot(1, 'A').current!, validUntil: Math.floor(now / 1000) + 30 },
  })
  const view = mount()
  await screen.findByRole('heading', { name: 'A' })
  let ready!: (value: AdvertSnapshot) => void
  api.getAdvertSnapshot.mockImplementationOnce(
    () =>
      new Promise<AdvertSnapshot>((resolve) => {
        ready = resolve
      }),
  )
  fireEvent.click(screen.getByRole('button', { name: 'Open list' }))
  vi.spyOn(Date, 'now').mockReturnValue(now + 31000)
  await act(async () => {
    ready(imageSnapshot(2, 'B'))
    await Promise.resolve()
  })
  expect(view.router.state.location.pathname).toBe('/')
})
it('keeps safe A after a failed B image and retries the latest publication on the next safety read', async () => {
  api.getAdvertSnapshot.mockResolvedValue(imageSnapshot(1, 'A'))
  api.prepareAdvertImage.mockResolvedValueOnce('blob:a')
  const view = mount()
  await screen.findByRole('heading', { name: 'A' })
  api.prepareAdvertImage.mockRejectedValueOnce(new Error('B was already superseded'))
  api.getAdvertSnapshot.mockResolvedValue(imageSnapshot(2, 'B'))
  fireEvent.focus(window)
  await waitFor(() => expect(api.prepareAdvertImage).toHaveBeenCalledTimes(2))
  expect(screen.getByRole('heading', { name: 'A' })).toBeTruthy()
  expect(view.container.querySelector('img')?.getAttribute('src')).toBe('blob:a')
  api.prepareAdvertImage.mockResolvedValueOnce('blob:c')
  api.getAdvertSnapshot.mockResolvedValue(imageSnapshot(3, 'C'))
  fireEvent.focus(window)
  await screen.findByRole('heading', { name: 'C' })
  expect(view.container.querySelector('img')?.getAttribute('src')).toBe('blob:c')
})
it('discards pending artwork across logout even when a mocked decoder ignores cancellation', async () => {
  api.getAdvertSnapshot.mockResolvedValue(imageSnapshot(1, 'A'))
  api.prepareAdvertImage.mockResolvedValueOnce('blob:a')
  const view = mount()
  await screen.findByRole('heading', { name: 'A' })
  let ready!: (url: string) => void
  api.prepareAdvertImage.mockImplementationOnce(
    () =>
      new Promise<string>((resolve) => {
        ready = resolve
      }),
  )
  api.getAdvertSnapshot.mockResolvedValue(imageSnapshot(2, 'B'))
  fireEvent.focus(window)
  await waitFor(() => expect(api.prepareAdvertImage).toHaveBeenCalledTimes(2))
  const signal = api.prepareAdvertImage.mock.calls[1][1] as AbortSignal
  act(() => {
    view.store.dispatch(userReceived(null))
  })
  expect(signal.aborted).toBe(true)
  await act(async () => {
    ready('blob:b')
    await Promise.resolve()
  })
  expect(screen.queryByRole('heading', { name: 'B' })).toBeNull()
  expect(view.store.getState().advertising.current).toBeNull()
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:a')
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:b')
})
it('ignores stale durable versions and follows only read-only polling while visible', async () => {
  vi.useFakeTimers()
  api.getAdvertSnapshot.mockResolvedValue({ ...snapshot(), version: 3 })
  mount()
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
  expect(screen.getByRole('heading', { name: current.payload.headline })).toBeTruthy()
  api.getAdvertSnapshot.mockResolvedValue(imageSnapshot(2, 'B'))
  await act(async () => {
    await vi.advanceTimersByTimeAsync(15000)
  })
  expect(api.getAdvertSnapshot).toHaveBeenCalledTimes(2)
  expect(api.prepareAdvertImage).not.toHaveBeenCalled()
  expect(screen.queryByRole('heading', { name: 'B' })).toBeNull()
  const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
  await act(async () => {
    await vi.advanceTimersByTimeAsync(30000)
  })
  expect(api.getAdvertSnapshot).toHaveBeenCalledTimes(2)
  hidden.mockReturnValue(false)
  api.getAdvertSnapshot.mockResolvedValue({ ...snapshot(), version: 4 })
  fireEvent(document, new Event('visibilitychange'))
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
  expect(api.getAdvertSnapshot).toHaveBeenCalledTimes(3)
})

it('suppresses A immediately on a newer disabled snapshot even while successor artwork is pending', async () => {
  api.getAdvertSnapshot.mockResolvedValue(imageSnapshot(1, 'A'))
  api.prepareAdvertImage.mockResolvedValueOnce('blob:a')
  const view = mount()
  await screen.findByRole('heading', { name: 'A' })
  let ready!: (url: string) => void
  api.prepareAdvertImage.mockImplementationOnce(
    () =>
      new Promise<string>((resolve) => {
        ready = resolve
      }),
  )
  api.getAdvertSnapshot.mockResolvedValue(imageSnapshot(2, 'B'))
  fireEvent.focus(window)
  await waitFor(() => expect(api.prepareAdvertImage).toHaveBeenCalledTimes(2))
  api.getAdvertSnapshot.mockResolvedValue({
    ...snapshot(),
    version: 3,
    enabled: false,
    current: null,
    references: {},
  })
  fireEvent.click(screen.getByRole('button', { name: 'Open list' }))
  await waitFor(() => expect(screen.queryByRole('heading', { name: 'A' })).toBeNull())
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:a')
  await act(async () => {
    ready('blob:b')
    await Promise.resolve()
  })
  expect(view.store.getState().advertising.current).toBeNull()
  expect(screen.queryByRole('heading', { name: 'B' })).toBeNull()
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:b')
})

it.each([
  new ApiError('Sign in', 401, 'unauthenticated'),
  new ApiError('Change password', 403, 'password_change_required'),
])(
  'clears the advert and private URL promptly on an authentication boundary failure',
  async (error) => {
    api.getAdvertSnapshot.mockResolvedValue(imageSnapshot(1, 'A'))
    api.prepareAdvertImage.mockResolvedValueOnce('blob:a')
    const view = mount()
    await screen.findByRole('heading', { name: 'A' })
    api.getAdvertSnapshot.mockRejectedValueOnce(error)
    fireEvent.focus(window)
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'A' })).toBeNull())
    expect(view.store.getState().advertising.current).toBeNull()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:a')
  },
)
it('hides A on an unknown metadata failure, then restores visibility only after successful eligibility revalidation', async () => {
  api.getAdvertSnapshot.mockResolvedValue(imageSnapshot(1, 'A'))
  api.prepareAdvertImage.mockResolvedValueOnce('blob:a')
  const view = mount()
  await screen.findByRole('heading', { name: 'A' })
  api.getAdvertSnapshot.mockRejectedValueOnce(new ApiError('Offline', 0, 'network_error'))
  fireEvent.focus(window)
  await waitFor(() => expect(screen.queryByRole('heading', { name: 'A' })).toBeNull())
  expect(view.store.getState().advertising.current?.id).toBe('A')
  expect(URL.revokeObjectURL).not.toHaveBeenCalledWith('blob:a')
  api.getAdvertSnapshot.mockResolvedValue(imageSnapshot(2, 'A'))
  fireEvent.focus(window)
  await screen.findByRole('heading', { name: 'A' })
  expect(api.prepareAdvertImage).toHaveBeenCalledTimes(1)
})
it('also clears A when B image preparation reveals that the session expired', async () => {
  api.getAdvertSnapshot.mockResolvedValue(imageSnapshot(1, 'A'))
  api.prepareAdvertImage.mockResolvedValueOnce('blob:a')
  const view = mount()
  await screen.findByRole('heading', { name: 'A' })
  api.getAdvertSnapshot.mockResolvedValue(imageSnapshot(2, 'B'))
  api.prepareAdvertImage.mockRejectedValueOnce(new ApiError('Sign in', 401, 'unauthenticated'))
  fireEvent.focus(window)
  await waitFor(() => expect(screen.queryByRole('heading', { name: 'A' })).toBeNull())
  expect(view.store.getState().advertising.current).toBeNull()
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:a')
})
