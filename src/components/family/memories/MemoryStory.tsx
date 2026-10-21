import { useId, useState } from 'react'
import './MemoryStory.css'

export function MemoryStory({ story }: { story: string }) {
  const [expanded, setExpanded] = useState(false)
  const id = useId()
  const shortened = story.length > 360
  return (
    <div className="memory-story">
      <div id={id} className="memory-story__text">
        {shortened && !expanded ? story.slice(0, 360).trimEnd() + '…' : story}
      </div>
      {shortened && (
        <button
          type="button"
          className="secondary"
          aria-expanded={expanded}
          aria-controls={id}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Show less' : 'Read the whole story'}
        </button>
      )}
    </div>
  )
}
