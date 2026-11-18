import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { prepareAdvertImage } from './prepare-image'
const api = vi.hoisted(() => ({ getAdvertImage: vi.fn(), decode: vi.fn() }))
vi.mock('../../services/advertising-api', () => ({ getAdvertImage: api.getAdvertImage }))
beforeEach(() => {
  api.getAdvertImage.mockReset().mockResolvedValue(new Blob(['jpeg'], { type: 'image/jpeg' }))
  api.decode.mockReset().mockResolvedValue(undefined)
  vi.stubGlobal(
    'URL',
    Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:prepared'), revokeObjectURL: vi.fn() }),
  )
  vi.stubGlobal(
    'Image',
    class {
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      set src(_value: string) {
        queueMicrotask(() => this.onload?.())
      }
      decode() {
        return api.decode()
      }
    },
  )
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})
it('does not release a publication image until browser decoding completes', async () => {
  let finish!: () => void
  api.decode.mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve
      }),
  )
  const ready = vi.fn()
  const pending = prepareAdvertImage('a'.repeat(48), new AbortController().signal).then(ready)
  await vi.waitFor(() => expect(api.decode).toHaveBeenCalledTimes(1))
  expect(ready).not.toHaveBeenCalled()
  finish()
  await pending
  expect(ready).toHaveBeenCalledWith('blob:prepared')
  expect(URL.revokeObjectURL).not.toHaveBeenCalled()
})
it('revokes rejected image decodes and cancelled pending decodes', async () => {
  api.decode.mockRejectedValueOnce(new Error('Invalid JPEG'))
  await expect(prepareAdvertImage('a'.repeat(48), new AbortController().signal)).rejects.toThrow(
    'Invalid JPEG',
  )
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:prepared')
  api.decode.mockImplementationOnce(() => new Promise(() => {}))
  const abort = new AbortController()
  const pending = prepareAdvertImage('a'.repeat(48), abort.signal)
  const check = expect(pending).rejects.toMatchObject({ name: 'AbortError' })
  await vi.waitFor(() => expect(api.decode).toHaveBeenCalledTimes(2))
  abort.abort()
  await check
  expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2)
})
it('bounds an unresponsive browser decoder to fifteen seconds', async () => {
  vi.useFakeTimers()
  api.decode.mockImplementationOnce(() => new Promise(() => {}))
  const pending = prepareAdvertImage('a'.repeat(48), new AbortController().signal)
  const check = expect(pending).rejects.toMatchObject({ code: 'request_timeout' })
  await vi.advanceTimersByTimeAsync(15000)
  await check
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:prepared')
  expect(vi.getTimerCount()).toBe(0)
})
