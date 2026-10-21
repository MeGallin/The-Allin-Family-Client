import { useId } from 'react'
import type { MemberResponse } from '../../../features/members/types'
import './MemberCredential.css'
export function MemberCredential({
  result,
  onDismiss,
}: {
  result: MemberResponse
  onDismiss: () => void
}) {
  const id = useId()
  return (
    <section className="surface-card member-credential" aria-labelledby={id + '-title'}>
      <h3 id={id + '-title'}>Sign-in details for {result.member.familyName}</h3>
      <p className="note">
        Share these privately. The temporary password is shown here once and must be changed at
        sign-in.
      </p>
      <label htmlFor={id + '-user'}>Username</label>
      <input id={id + '-user'} value={result.member.username} readOnly autoComplete="off" />
      <label htmlFor={id + '-password'}>Temporary password</label>
      <input
        id={id + '-password'}
        value={result.temporaryPassword ?? ''}
        readOnly
        autoComplete="off"
        spellCheck={false}
        className="member-credential__password"
        onFocus={(event) => event.target.select()}
      />
      <button type="button" className="secondary" onClick={onDismiss}>
        I’ve saved the details — dismiss
      </button>
    </section>
  )
}
