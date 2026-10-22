import { afterEach, describe, expect, it, vi } from 'vitest'
import { createAppStore } from '../../app/store'
import { clearPrivateState } from '../../app/session-actions'
import { userReceived } from '../auth/auth-slice'
import { weekContextApi } from '../../services/week-context-query'
import { deferred, jsonResponse, testUser } from '../../test/fixtures'
import { weatherCondition } from './weather-view'
const stores: ReturnType<typeof createAppStore>[] = []
afterEach(() => stores.splice(0).forEach((store) => clearPrivateState(store.dispatch)))
function setup() {
  const store = createAppStore()
  stores.push(store)
  store.dispatch(userReceived(testUser))
  return store
}
describe('personal weather caches', () => {
  it('clears preferences and forecast data on sign-out before the next account reads', async () => {
    const store = setup()
    const first = {
      town: { id: 1, label: 'First town', timeZone: 'Europe/London' },
      region: 'scotland',
      version: 1,
    }
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(jsonResponse(first))
        .mockResolvedValueOnce(jsonResponse({ ...first, town: null, region: 'northern-ireland' })),
    )
    await store
      .dispatch(
        weekContextApi.endpoints.getWeekPreferences.initiate(undefined, { subscribe: false }),
      )
      .unwrap()
    expect(
      weekContextApi.endpoints.getWeekPreferences.select()(store.getState()).data?.town?.label,
    ).toBe('First town')
    clearPrivateState(store.dispatch)
    store.dispatch(userReceived({ ...testUser, id: testUser.id + 1 }))
    expect(
      weekContextApi.endpoints.getWeekPreferences.select()(store.getState()).data,
    ).toBeUndefined()
    const next = await store
      .dispatch(
        weekContextApi.endpoints.getWeekPreferences.initiate(undefined, { subscribe: false }),
      )
      .unwrap()
    expect(next.town).toBeNull()
    expect(next.region).toBe('northern-ireland')
    expect(fetch).toHaveBeenCalledTimes(2)
  })
  it('does not let a late previous-account save repopulate preferences after logout', async () => {
    const store = setup()
    const waiting = deferred<Response>()
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(waiting.promise))
    const saving = store.dispatch(
      weekContextApi.endpoints.saveWeekPreferences.initiate({ version: 0, region: 'scotland' }),
    )
    clearPrivateState(store.dispatch)
    store.dispatch(userReceived({ ...testUser, id: testUser.id + 1 }))
    waiting.resolve(jsonResponse({ version: 1, town: null, region: 'scotland' }))
    await saving
    expect(
      weekContextApi.endpoints.getWeekPreferences.select()(store.getState()).data,
    ).toBeUndefined()
  })
  it('maps frozen precipitation and unknown codes without claiming clear skies', () => {
    expect(weatherCondition(0).label).toBe('Clear sky')
    expect(weatherCondition(71).label).toBe('Snow')
    expect(weatherCondition(95).label).toBe('Thunderstorms')
    expect(weatherCondition(999).label).toBe('Conditions unavailable')
  })
})
