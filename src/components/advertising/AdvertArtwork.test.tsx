import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { createAppStore } from '../../app/store'
import { userReceived } from '../../features/auth/auth-slice'
import { advertSnapshotReceived } from '../../features/advertising/advertising-slice'
import { clearAdvertImage } from '../../features/advertising/image-cache'
import { AdvertArtwork } from './AdvertArtwork'
import { AdvertCard } from './AdvertCard'
import type { AdvertRecord } from '../../features/advertising/types'
const api = vi.hoisted(() => ({ getAdvertImage: vi.fn() }))
vi.mock('../../services/advertising-api', () => api)
const image = {
  id: 'a'.repeat(48),
  width: 1536,
  height: 1024,
  bytes: 4,
  mime: 'image/jpeg' as const,
}
const user = {
  id: 42,
  username: 'fixture-dad',
  familyName: 'Dad',
  displayName: 'Dad',
  nickname: 'Dad',
  role: 'admin' as const,
  profileVersion: 1,
  mustChangePassword: false,
}
const record: AdvertRecord = {
  id: 'a',
  featureHash: 'safe',
  configRevision: 1,
  preparedAt: 1,
  approved: true,
  promotedAt: 1,
  image,
  payload: {
    featureId: 'shopping',
    ctaId: 'shopping',
    format: 'headline',
    headline: 'Fresh campaign',
    message: 'Keep it together.',
    scenario: '',
    items: [],
    factIds: ['fact-1'],
  },
}
function setup() {
  const store = createAppStore()
  store.dispatch(userReceived(user))
  store.dispatch(
    advertSnapshotReceived({
      ownerId: user.id,
      snapshot: { enabled: true, current: record, references: { shopping: 'safe' }, serverTime: 1 },
    }),
  )
  return store
}
beforeEach(() => {
  clearAdvertImage()
  vi.stubGlobal(
    'URL',
    Object.assign(URL, {
      createObjectURL: vi.fn(() => 'blob:campaign-a'),
      revokeObjectURL: vi.fn(),
    }),
  )
  api.getAdvertImage.mockReset().mockResolvedValue(new Blob(['jpeg'], { type: 'image/jpeg' }))
})
afterEach(() => {
  clearAdvertImage()
  vi.unstubAllGlobals()
})
it('retains the displayed image across unmount, then revokes it when publication changes or logout occurs', async () => {
  const store = setup()
  const first = render(
    <Provider store={store}>
      <AdvertArtwork image={image} session />
    </Provider>,
  )
  await waitFor(() => expect(first.container.querySelector('img')).toBeTruthy())
  first.unmount()
  expect(URL.revokeObjectURL).not.toHaveBeenCalled()
  const second = render(
    <Provider store={store}>
      <AdvertArtwork image={image} session />
    </Provider>,
  )
  expect(second.container.querySelector('img')?.getAttribute('src')).toBe('blob:campaign-a')
  expect(api.getAdvertImage).toHaveBeenCalledTimes(1)
  act(() => {
    store.dispatch(
      advertSnapshotReceived({
        ownerId: user.id,
        snapshot: {
          version: 2,
          enabled: true,
          current: { ...record, id: 'b', image: { ...image, id: 'b'.repeat(48) } },
          references: { shopping: 'safe' },
          serverTime: 2,
        },
      }),
    )
  })
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:campaign-a')
  act(() => {
    store.dispatch(userReceived(null))
  })
})
it('aborts a pending image on account change and discards an ignored late completion', async () => {
  let finish!: (value: Blob) => void
  api.getAdvertImage.mockImplementationOnce(
    () =>
      new Promise<Blob>((resolve) => {
        finish = resolve
      }),
  )
  const store = setup()
  const view = render(
    <Provider store={store}>
      <AdvertArtwork image={image} session />
    </Provider>,
  )
  const signal = api.getAdvertImage.mock.calls[0][1] as AbortSignal
  act(() => {
    store.dispatch(userReceived(null))
  })
  expect(signal.aborted).toBe(true)
  await act(async () => {
    finish(new Blob(['late'], { type: 'image/jpeg' }))
    await Promise.resolve()
  })
  expect(URL.createObjectURL).not.toHaveBeenCalled()
  expect(view.container.querySelector('img')).toBeNull()
})
it('revokes temporary admin preview URLs on unmount and leaves readable fallback on failure', async () => {
  const store = setup()
  const view = render(
    <Provider store={store}>
      <AdvertArtwork image={image} />
    </Provider>,
  )
  await waitFor(() => expect(view.container.querySelector('img')).toBeTruthy())
  view.unmount()
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:campaign-a')
  api.getAdvertImage.mockRejectedValueOnce(new Error('Unavailable'))
  const fallback = render(
    <Provider store={store}>
      <AdvertArtwork image={image} />
    </Provider>,
  )
  await waitFor(() => expect(api.getAdvertImage).toHaveBeenCalledTimes(2))
  expect(screen.getByText('A little more from your family space')).toBeTruthy()
  expect(fallback.container.querySelector('.advert-card__artwork')).toBeTruthy()
})

it('keeps generated format extras in a closed accessible disclosure for campaign cards', async () => {
  const store = setup()
  const view = render(
    <Provider store={store}>
      <AdvertCard
        image={image}
        variant="compact"
        payload={{
          ...record.payload,
          format: 'process',
          scenario: 'Imagine planning together.',
          items: ['Make a list', 'Check it together'],
        }}
      />
    </Provider>,
  )
  await waitFor(() => expect(view.container.querySelector('img')).toBeTruthy())
  const disclosure = view.container.querySelector('details')!
  expect(disclosure.hasAttribute('open')).toBe(false)
  expect(screen.getByText('See the steps')).toBeTruthy()
  expect(disclosure.querySelectorAll('ol li')).toHaveLength(2)
  expect(screen.getByText('Imagine this · illustrative scenario')).toBeTruthy()
  expect(view.container.querySelector('[style],style')).toBeNull()
})

it.each(['poster', 'split', 'image-led'] as const)(
  'honours %s with an accessible claim and no visible claim paragraph in the campaign',
  async (composition) => {
    const store = setup()
    const view = render(
      <Provider store={store}>
        <AdvertCard image={image} variant="compact" payload={{ ...record.payload, composition }}>
          <button>Open list</button>
        </AdvertCard>
      </Provider>,
    )
    await waitFor(() => expect(view.container.querySelector('img')).toBeTruthy())
    const region = screen.getByRole('region', { name: 'Feature spotlight' })
    const claim = document.getElementById(region.getAttribute('aria-describedby')!)!
    expect(claim.textContent).toBe(record.payload.message)
    expect(claim.className).toBe('advert-campaign__accessible-message')
    expect(view.container.querySelector('.advert-campaign--' + composition)).toBeTruthy()
    expect(view.container.querySelector('.advert-campaign')!.textContent).not.toContain(
      record.payload.message,
    )
    expect(screen.getByRole('heading', { name: record.payload.headline })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Open list' })).toBeTruthy()
  },
)
it('defaults legacy image records to poster and keeps admin claim review outside the representative canvas', async () => {
  const store = setup()
  const view = render(
    <Provider store={store}>
      <AdvertCard image={image} payload={record.payload} />
    </Provider>,
  )
  await waitFor(() => expect(view.container.querySelector('img')).toBeTruthy())
  expect(view.container.querySelector('.advert-campaign--poster')).toBeTruthy()
  expect(view.container.querySelector('.advert-campaign')!.textContent).not.toContain(
    record.payload.message,
  )
  expect(view.container.querySelector('.advert-campaign__review')!.textContent).toContain(
    record.payload.message,
  )
  expect(view.container.querySelector('.advert-campaign__cta-preview')!.textContent).toBe(
    'Open list',
  )
})
