import { useEffect, useState } from 'react'
import { useAppSelector } from '../../app/store-hooks'
import type { AdvertImage } from '../../features/advertising/types'
import {
  advertImageSessionEpoch,
  cachedAdvertImage,
  retainAdvertImage,
} from '../../features/advertising/image-cache'
import { getAdvertImage } from '../../services/advertising-api'

export function AdvertArtwork({
  image,
  session = false,
}: {
  image: AdvertImage
  session?: boolean
}) {
  const owner = useAppSelector((s) => s.auth.user?.id)
  const generation = useAppSelector((s) => s.auth.generation)
  const key = owner + ':' + generation + ':' + image.id
  const [loaded, setLoaded] = useState<{ key: string; url: string } | null>(null)
  const [failed, setFailed] = useState<string | null>(null)
  const url =
    failed === key
      ? null
      : loaded?.key === key
        ? loaded.url
        : session
          ? cachedAdvertImage(key)
          : null
  useEffect(() => {
    if (!owner || (session && cachedAdvertImage(key))) return
    const epoch = advertImageSessionEpoch()
    const abort = new AbortController()
    let ownedUrl: string | null = null
    void getAdvertImage(image.id, abort.signal)
      .then((blob) => {
        if (abort.signal.aborted || epoch !== advertImageSessionEpoch()) return
        const next = URL.createObjectURL(blob)
        if (session) retainAdvertImage(key, next)
        else ownedUrl = next
        setLoaded({ key, url: next })
      })
      .catch(() => {
        if (!abort.signal.aborted) setFailed(key)
      })
    return () => {
      abort.abort()
      if (ownedUrl) URL.revokeObjectURL(ownedUrl)
    }
  }, [owner, generation, key, image.id, session])
  return (
    <div className="advert-card__artwork" aria-hidden="true">
      {url ? (
        <img
          src={url}
          alt=""
          width={image.width}
          height={image.height}
          onError={() => setFailed(key)}
        />
      ) : (
        <span className="advert-card__artwork-fallback">A little more from your family space</span>
      )}
    </div>
  )
}
