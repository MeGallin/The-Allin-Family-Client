import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAppDispatch, useAppSelector } from '../../app/store-hooks'
import {
  advertSnapshotReceived,
  advertSafetyReceived,
  advertAccessFailed,
} from '../../features/advertising/advertising-slice'
import { advertDestinations } from '../../features/advertising/destinations'
import { getAdvertSnapshot } from '../../services/advertising-api'
import { ApiError } from '../../services/api-client'
import { AdvertCard } from './AdvertCard'
import type { AdvertSnapshot } from '../../features/advertising/types'
import { prepareAdvertImage } from '../../features/advertising/prepare-image'
import {
  advertImageSessionEpoch,
  cachedAdvertImage,
  retainAdvertImage,
  releaseAdvertImage,
} from '../../features/advertising/image-cache'

export function HomeSpotlight() {
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)
  const generation = useAppSelector((s) => s.auth.generation)
  const {
    current,
    enabled,
    references,
    version: observedVersion,
  } = useAppSelector((s) => s.advertising)
  const [expiryTick, setExpiryTick] = useState(0)
  const expired = Boolean(current?.validUntil && current.validUntil * 1000 <= Date.now())
  const [checking, setChecking] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [safetyKnown, setSafetyKnown] = useState(false)
  const clickAbort = useRef<AbortController | null>(null)
  const serial = useRef(0)
  const latestVersion = useRef(-1)
  const navigate = useNavigate()
  const authFailure = (error: unknown) =>
    error instanceof ApiError && (error.status === 401 || error.code === 'password_change_required')
  function safetyFailure(error: unknown, requestId: number, epoch: number) {
    if (!user || requestId !== serial.current || epoch !== advertImageSessionEpoch()) return
    setSafetyKnown(false)
    if (authFailure(error)) {
      serial.current += 1
      dispatch(advertAccessFailed(user.id))
    }
  }
  function acceptSafety(
    snapshot: AdvertSnapshot,
    abort: AbortController,
    requestId: number,
    epoch: number,
  ) {
    if (
      !user ||
      abort.signal.aborted ||
      requestId !== serial.current ||
      epoch !== advertImageSessionEpoch()
    )
      return false
    const version = snapshot.version ?? 0
    if (version < latestVersion.current) return false
    latestVersion.current = version
    dispatch(advertSafetyReceived({ ownerId: user.id, snapshot }))
    setSafetyKnown(true)
    return true
  }
  async function accept(
    snapshot: AdvertSnapshot,
    abort: AbortController,
    requestId: number,
    epoch: number,
  ) {
    if (!user || !acceptSafety(snapshot, abort, requestId, epoch)) return
    const version = snapshot.version ?? 0
    const image = snapshot.enabled ? snapshot.current?.image : null
    let staged: { key: string; url: string } | null = null
    try {
      if (image) {
        const key = user.id + ':' + generation + ':' + image.id
        if (!cachedAdvertImage(key)) {
          const url = await prepareAdvertImage(image.id, abort.signal)
          staged = { key, url }
        }
      }
      if (
        abort.signal.aborted ||
        requestId !== serial.current ||
        epoch !== advertImageSessionEpoch() ||
        version < latestVersion.current
      )
        return
      if (staged) retainAdvertImage(staged.key, staged.url)
      dispatch(advertSnapshotReceived({ ownerId: user.id, snapshot }))
      staged = null
    } finally {
      if (staged) {
        // It was never handed to the displayed publication.
        if (cachedAdvertImage(staged.key) === staged.url) releaseAdvertImage(staged.key, staged.url)
        else URL.revokeObjectURL(staged.url)
      }
    }
  }
  useEffect(() => {
    latestVersion.current = observedVersion
    setSafetyKnown(false)
    setChecking(false)
    setFeedback('')
    if (!user) return
    let stopped = false
    let active: AbortController | null = null
    const refresh = () => {
      if (stopped || document.hidden || active || clickAbort.current) return
      const abort = new AbortController()
      active = abort
      const requestId = ++serial.current
      const epoch = advertImageSessionEpoch()
      void getAdvertSnapshot(abort.signal)
        .then((snapshot) =>
          stopped
            ? undefined
            : accept(snapshot, abort, requestId, epoch).catch((error: unknown) => {
                // Only image preparation failed after authoritative eligibility was read.
                if (!abort.signal.aborted && authFailure(error))
                  safetyFailure(error, requestId, epoch)
              }),
        )
        .catch((error: unknown) => {
          if (!stopped && !abort.signal.aborted) safetyFailure(error, requestId, epoch)
        })
        .finally(() => {
          if (active === abort) active = null
        })
    }
    const visibility = () => {
      if (document.hidden) {
        active?.abort()
        active = null
      } else refresh()
    }
    refresh()
    const interval = setInterval(refresh, 15000)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', visibility)
    return () => {
      stopped = true
      serial.current += 1
      active?.abort()
      clickAbort.current?.abort()
      clickAbort.current = null
      clearInterval(interval)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [dispatch, user?.id, generation])
  useEffect(() => {
    const remaining = current?.validUntil ? current.validUntil * 1000 - Date.now() : null
    if (remaining === null || remaining <= 0) return
    const timeout = setTimeout(
      () => setExpiryTick((value) => value + 1),
      Math.min(2147483647, remaining),
    )
    return () => clearTimeout(timeout)
  }, [current, expiryTick])
  if (
    !user ||
    !enabled ||
    !safetyKnown ||
    !current ||
    expired ||
    references[current.payload.featureId] !== current.featureHash
  )
    return null
  const destination = advertDestinations[current.payload.ctaId]
  if (!destination) return null
  async function follow() {
    const abort = new AbortController()
    clickAbort.current?.abort()
    clickAbort.current = abort
    const requestId = ++serial.current
    const epoch = advertImageSessionEpoch()
    setChecking(true)
    setFeedback('')
    let metadataKnown = false
    try {
      const snapshot = await getAdvertSnapshot(abort.signal)
      if (abort.signal.aborted) return
      metadataKnown = true
      // Navigation needs authoritative eligibility, not the successor's artwork.
      // The regular refresh stages a complete successor pair independently.
      if (!acceptSafety(snapshot, abort, requestId, epoch)) return
      if (
        abort.signal.aborted ||
        requestId !== serial.current ||
        epoch !== advertImageSessionEpoch() ||
        (snapshot.version ?? 0) < latestVersion.current
      )
        return
      if (
        snapshot.enabled &&
        snapshot.references[current!.payload.featureId] === current!.featureHash &&
        (!current!.validUntil || current!.validUntil * 1000 > Date.now())
      )
        navigate(destination.path)
      else setFeedback('This feature spotlight is no longer available.')
    } catch (error) {
      if (!abort.signal.aborted) {
        if (!metadataKnown || authFailure(error)) safetyFailure(error, requestId, epoch)
        setFeedback('Unable to check this feature. Please try again.')
      }
    } finally {
      if (clickAbort.current === abort) clickAbort.current = null
      if (!abort.signal.aborted) setChecking(false)
    }
  }
  return (
    <div className="home-spotlight">
      <AdvertCard payload={current.payload} image={current.image} sessionImage variant="compact">
        <button
          type="button"
          className="secondary"
          disabled={checking}
          onClick={() => void follow()}
        >
          {checking ? 'Checking…' : current.image ? destination.shortLabel : destination.label}
        </button>
      </AdvertCard>
      {feedback && <p role="status">{feedback}</p>}
    </div>
  )
}
