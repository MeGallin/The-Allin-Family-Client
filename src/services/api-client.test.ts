import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearSnapshotResponses, request } from './api-client'
import { deferred, jsonResponse } from '../test/fixtures'
beforeEach(() => clearSnapshotResponses())
describe('private conditional response transport', () => {
  it('reuses unchanged snapshots without parsing an empty 304 body', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ notes: ['private'] }, 200, { ETag: '"one"' }))
      .mockResolvedValueOnce(new Response(null, { status: 304 }))
    vi.stubGlobal('fetch', fetchMock)
    const original = await request('/notes')
    expect(await request('/notes')).toEqual(original)
    expect(new Headers(fetchMock.mock.calls[1][1]?.headers).get('If-None-Match')).toBe('"one"')
  })
  it('clears private data and validators between accounts', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      jsonResponse({ notes: [] }, 200, { ETag: '"one"' }),
    )
    vi.stubGlobal('fetch', fetchMock)
    await request('/notes')
    clearSnapshotResponses()
    await request('/notes')
    expect(new Headers(fetchMock.mock.calls[1][1]?.headers).has('If-None-Match')).toBe(false)
  })
  it('rejects a late previous-session response before caching it', async () => {
    const waiting = deferred<Response>()
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockReturnValueOnce(waiting.promise)
      .mockResolvedValue(jsonResponse({ notes: [] }))
    vi.stubGlobal('fetch', fetchMock)
    const pending = request('/notes')
    const rejected = expect(pending).rejects.toMatchObject({ name: 'AbortError' })
    clearSnapshotResponses()
    waiting.resolve(jsonResponse({ notes: ['old private note'] }, 200, { ETag: '"old"' }))
    await rejected
    await request('/notes')
    expect(new Headers(fetchMock.mock.calls[1][1]?.headers).has('If-None-Match')).toBe(false)
  })
  it('clears validators on an expired session', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ notes: [] }, 200, { ETag: '"old"' }))
      .mockResolvedValueOnce(jsonResponse({ error: 'Sign in', code: 'unauthorized' }, 401))
      .mockResolvedValueOnce(jsonResponse({ notes: [] }))
    vi.stubGlobal('fetch', fetchMock)
    await request('/notes')
    await expect(request('/notes')).rejects.toMatchObject({ status: 401 })
    await request('/notes')
    expect(new Headers(fetchMock.mock.calls[2][1]?.headers).has('If-None-Match')).toBe(false)
  })
})
