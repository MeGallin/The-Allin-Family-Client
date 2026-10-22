/** Cached summaries can remain visible when a background refresh fails. */
export function HomeDataError({ error, retry }: { error: string; retry: () => void }) {
  if (!error) return null
  return (
    <div className="home-data-error" role="alert">
      <p>{error}</p>
      <button type="button" className="secondary" onClick={retry}>
        Try again
      </button>
    </div>
  )
}
