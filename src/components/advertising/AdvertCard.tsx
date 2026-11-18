import type { AdvertImage, AdvertPayload } from '../../features/advertising/types'
import './AdvertCard.css'
import { AdvertArtwork } from './AdvertArtwork'
import { advertDestinations } from '../../features/advertising/destinations'
import { useId } from 'react'

function Scenario({ text }: { text: string }) {
  return text ? (
    <p className="advert-card__scenario">
      <span className="eyebrow">Imagine this · illustrative scenario</span>
      {text}
    </p>
  ) : null
}

function FormatItems({ payload }: { payload: AdvertPayload }) {
  if (payload.format === 'headline') return null
  if (payload.format === 'comparison')
    return (
      <div>
        <p className="note">Two possibilities · an illustrative comparison</p>
        <div className="advert-card__comparison">
          {payload.items.map((item, i) => (
            <p key={i}>
              <span className="eyebrow">{i === 0 ? 'One possibility' : 'Another possibility'}</span>
              {item}
            </p>
          ))}
        </div>
      </div>
    )
  const List = payload.format === 'process' ? 'ol' : 'ul'
  return (
    <List
      className={payload.format === 'process' ? 'advert-card__steps' : 'advert-card__checklist'}
    >
      {payload.items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </List>
  )
}

function AdvertCampaign({
  payload,
  image,
  sessionImage,
  compact,
  children,
}: {
  payload: AdvertPayload
  image: AdvertImage
  sessionImage: boolean
  compact: boolean
  children?: React.ReactNode
}) {
  const messageId = useId()
  const Heading = compact ? 'h3' : 'h2'
  const composition = ['poster', 'split', 'image-led'].includes(payload.composition ?? '')
    ? payload.composition!
    : 'poster'
  const destination = advertDestinations[payload.ctaId]
  return (
    <section
      className="advert-campaign-shell"
      aria-label="Feature spotlight"
      aria-describedby={compact ? messageId : undefined}
    >
      <div className={'advert-campaign advert-campaign--' + composition}>
        <AdvertArtwork image={image} session={sessionImage} />
        <div className="advert-campaign__type">
          <p className="advert-campaign__service">{destination?.service ?? 'The Allin Family'}</p>
          <Heading>{payload.headline}</Heading>
        </div>
        <div className="advert-campaign__action">
          {children ?? (
            <span className="advert-campaign__cta-preview" aria-hidden="true">
              {destination?.shortLabel ?? 'Explore feature'}
            </span>
          )}
        </div>
      </div>
      {compact ? (
        <>
          <p id={messageId} className="advert-campaign__accessible-message">
            {payload.message}
          </p>
          {(payload.scenario || payload.items.length > 0) && (
            <details className="advert-card__details advert-campaign__details">
              <summary>
                {payload.format === 'process'
                  ? 'See the steps'
                  : payload.format === 'checklist'
                    ? 'See the checklist'
                    : payload.format === 'comparison'
                      ? 'Compare possibilities'
                      : 'An illustrative example'}
              </summary>
              <div className="advert-card__extra">
                <Scenario text={payload.scenario} />
                <FormatItems payload={payload} />
              </div>
            </details>
          )}
        </>
      ) : (
        <div className="advert-campaign__review">
          <p className="note">Copy review · {composition}</p>
          <p>{payload.message}</p>
          <Scenario text={payload.scenario} />
          <FormatItems payload={payload} />
        </div>
      )}
    </section>
  )
}

export function AdvertCard({
  payload,
  children,
  variant = 'default',
  image,
  sessionImage = false,
}: {
  payload: AdvertPayload
  image?: AdvertImage
  sessionImage?: boolean
  children?: React.ReactNode
  variant?: 'default' | 'compact'
}) {
  if (image)
    return (
      <AdvertCampaign
        payload={payload}
        image={image}
        sessionImage={sessionImage}
        compact={variant === 'compact'}
      >
        {children}
      </AdvertCampaign>
    )
  const Heading = variant === 'compact' ? 'h3' : 'h2'
  const moreLabel =
    payload.format === 'headline'
      ? 'An illustrative example'
      : payload.format === 'process'
        ? 'See the steps'
        : payload.format === 'checklist'
          ? 'See the checklist'
          : 'Compare possibilities'
  return (
    <section
      className={
        'advert-card advert-card--' +
        payload.format +
        (variant === 'compact' ? ' advert-card--compact' : '')
      }
      aria-label="Feature spotlight"
    >
      <div className="advert-card__intro">
        <p className="eyebrow">
          {variant === 'compact' ? 'Feature spotlight' : 'A little more from your family space'}
        </p>
        <Heading>{payload.headline}</Heading>
      </div>
      {variant === 'default' && <Scenario text={payload.scenario} />}
      <p className="advert-card__message">{payload.message}</p>
      {variant === 'compact'
        ? (payload.scenario || payload.items.length > 0) && (
            <details className="advert-card__details">
              <summary>{moreLabel}</summary>
              <div className="advert-card__extra">
                <Scenario text={payload.scenario} />
                <FormatItems payload={payload} />
              </div>
            </details>
          )
        : variant === 'default' && <FormatItems payload={payload} />}
      {children && <div className="advert-card__action">{children}</div>}
    </section>
  )
}
