import './NotePin.css'

/** Decorative thumbtack: cap, neck, base and metal needle are CSS shapes. */
export function NotePin() {
  return (
    <span className="note-pin" aria-hidden="true">
      <span className="note-pin__needle" />
      <span className="note-pin__base" />
      <span className="note-pin__neck" />
      <span className="note-pin__cap" />
    </span>
  )
}
