import { useEffect, type ReactNode } from 'react'
import './PageHeader.css'

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  useEffect(() => {
    document.title = title + ' · ' + (import.meta.env.VITE_APP_NAME || 'The Allin Family')
  }, [title])
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </header>
  )
}
