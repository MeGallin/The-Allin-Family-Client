import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import { Icon } from '../../ui/Icon'
import './FamilyImage.css'

type Props = {
  src: string
  alt: string
  eager?: boolean
  srcSet?: string
  sizes?: string
  width?: number
  height?: number
}
export function FamilyImage(props: Props) {
  // A replaced photo gets a new loading/error lifecycle, even in the same card.
  return <ImageContent key={props.src} {...props} />
}
function ImageContent({
  src,
  alt,
  eager = false,
  srcSet,
  sizes,
  width = 1200,
  height = 700,
}: Props) {
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
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          width={width}
          height={height}
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
