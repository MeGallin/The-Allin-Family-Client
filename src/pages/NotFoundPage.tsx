import { Link } from 'react-router'
import { Compass } from 'lucide-react'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'

export default function NotFoundPage() {
  return (
    <div className="page-stack">
      <PageHeader
        title="A little off track."
        description="That page isn’t part of your family space."
      />
      <EmptyState icon={Compass} title="Let’s get you home">
        <Link className="button-link" to="/">
          Back to home
        </Link>
      </EmptyState>
    </div>
  )
}
