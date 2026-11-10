import './NonogramArt.css'
/** Same original coloured-grid motif in catalogue, shelf and game heading. */
export function NonogramArt() {
  return (
    <span className="nonogram-art" aria-hidden="true">
      {'0010001110111110111000100'.split('').map((v, i) => (
        <i key={i} className={v === '1' ? 'is-filled' : ''} />
      ))}
    </span>
  )
}
