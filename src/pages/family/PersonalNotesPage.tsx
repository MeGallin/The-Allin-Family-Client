import { LockKeyhole } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Panel } from '../../components/ui/Panel'
import { Icon } from '../../components/ui/Icon'
import './PersonalNotesPage.css'

export default function PersonalNotesPage() {
  return (
    <div className="page-stack page-enter personal-notes-page">
      <PageHeader
        title="Personal notes"
        description="A little space for your own thoughts, plans and things to remember."
      />
      <Panel title="Your own notebook">
        <p className="personal-notes-page__privacy">
          <Icon icon={LockKeyhole} />
          <span>Planned as private to you, separate from the shared family pages.</span>
        </p>
        <p>
          Coming later. This is where you’ll be able to create, edit and delete your personal notes.
          Writing and saving notes aren’t available yet.
        </p>
        <dl className="personal-notes-page__features">
          <div>
            <dt>Room for the whole thought</dt>
            <dd>A title, header, full note body and footer.</dd>
          </div>
          <div>
            <dt>Dates to keep things clear</dt>
            <dd>A date for your note, plus when it was created and last edited.</dd>
          </div>
          <div>
            <dt>Yours to manage</dt>
            <dd>Find your notes, make changes and delete the ones you no longer need.</dd>
          </div>
        </dl>
      </Panel>
    </div>
  )
}
