import { getAdvertImage } from '../../services/advertising-api'
import { withRequestTimeout } from '../../services/request-timeout'

// Decode off-screen before the publication's copy and image enter the visible UI.
export function prepareAdvertImage(id: string, signal: AbortSignal) {
  return withRequestTimeout(async (bounded) => {
    const blob = await getAdvertImage(id, bounded)
    if (bounded.aborted) throw new DOMException('Request cancelled', 'AbortError')
    const url = URL.createObjectURL(blob)
    try {
      await new Promise<void>((resolve, reject) => {
        const image = new Image()
        const finish = (error?: unknown) => {
          image.onload = null
          image.onerror = null
          bounded.removeEventListener('abort', cancel)
          if (error) reject(error)
          else resolve()
        }
        const cancel = () => finish(new DOMException('Request cancelled', 'AbortError'))
        bounded.addEventListener('abort', cancel, { once: true })
        image.onload = () => {
          void image.decode().then(() => finish(), finish)
        }
        image.onerror = () => finish(new Error('Campaign artwork unavailable'))
        image.src = url
        if (bounded.aborted) cancel()
      })
      if (bounded.aborted) throw new DOMException('Request cancelled', 'AbortError')
      return url
    } catch (error) {
      URL.revokeObjectURL(url)
      throw error
    }
  }, signal)
}
