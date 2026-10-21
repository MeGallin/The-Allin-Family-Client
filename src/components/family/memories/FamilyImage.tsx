import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import { Icon } from '../../ui/Icon'
import './FamilyImage.css'

export function FamilyImage({
  src,
  alt,
  eager = false,
}: {
  src: string
  alt: string
  eager?: boolean
}) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  return (
    <div className={'family-image' + (loaded ? ' is-loaded' : '')}>
      {failed ? (
        <div
          className="family-image__fallback"
          role="img"
          aria-label={alt + ' — image unavailable'}
        >
          <Icon icon={ImageOff} />
          <span>Photo could not be loaded</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          width={1200}
          height={700}
          loading={eager ? 'eager' : 'lazy'}
          fetchPriority={eager ? 'high' : 'auto'}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  )
}
