import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { profileApi } from '../../services/profile-query'
import { shoppingError } from '../../services/shopping-query'
import type { FamilyUser } from '../../types/auth'
import './NicknameForm.css'

export function NicknameForm({ profile, admin = false }: { profile: FamilyUser; admin?: boolean }) {
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const wasSaving = useRef(false)
  const [draft, setDraft] = useState({
    nickname: profile.nickname ?? '',
    version: profile.profileVersion,
  })
  const [feedback, setFeedback] = useState('')
  const [save, { isLoading, error, reset }] = profileApi.useChangeNicknameMutation()
  useEffect(() => {
    if (wasSaving.current && !isLoading) inputRef.current?.focus()
    wasSaving.current = isLoading
  }, [isLoading])
  const changedElsewhere = profile.profileVersion > draft.version
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFeedback('')
    try {
      const result = await save({ ...draft, ...(admin ? { userId: profile.id } : {}) }).unwrap()
      setDraft({ nickname: result.profile.nickname ?? '', version: result.profile.profileVersion })
      setFeedback(`Saved. Family pages will show ${result.profile.familyName}.`)
    } catch {
      /* Keep the draft so the person can correct or retry it. */
    }
  }
  return (
    <form className="nickname-form" onSubmit={submit}>
      <label htmlFor={id}>Nickname</label>
      <input
        id={id}
        ref={inputRef}
        value={draft.nickname}
        maxLength={40}
        disabled={isLoading}
        aria-describedby={id + '-help'}
        onChange={(event) => {
          setDraft({ ...draft, nickname: event.target.value })
          setFeedback('')
        }}
        autoComplete="off"
      />
      <p id={id + '-help'} className="note">
        Up to 40 characters. Leave blank to use the first name. The account name and sign-in
        username stay the same.
      </p>
      {changedElsewhere && (
        <div className="nickname-form__conflict">
          <p className="note">A newer profile version is available.</p>
          <button
            type="button"
            className="secondary"
            disabled={isLoading}
            onClick={() => {
              setDraft({ nickname: profile.nickname ?? '', version: profile.profileVersion })
              setFeedback('')
              reset()
              inputRef.current?.focus()
            }}
          >
            Load latest nickname
          </button>
        </div>
      )}
      {error && (
        <p className="error" role="alert">
          {shoppingError(error)?.message ?? 'Unable to save the nickname. Please try again.'}
        </p>
      )}
      <button type="submit" disabled={isLoading || changedElsewhere}>
        {isLoading ? 'Saving…' : 'Save nickname'}
      </button>
      <p className="nickname-form__feedback" role="status">
        {feedback}
      </p>
    </form>
  )
}
