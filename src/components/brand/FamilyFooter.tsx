import { FamilyBrand } from './FamilyBrand'
import { useReleaseVersion } from './useReleaseVersion'
import './FamilyFooter.css'

export function FamilyFooter({ showBrand = true }: { showBrand?: boolean }) {
  const version = useReleaseVersion()
  return (
    <footer className="family-footer">
      {showBrand && <FamilyBrand variant="shield" size="small" />}
      <div className="family-footer__copy">
        <p>A private space for the people who matter.</p>
        <p>
          Hosted by{' '}
          <a
            href="https://www.trilogywebsolutions.co.uk/clients/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Trilogy Web Solutions
          </a>
        </p>
      </div>
      <span className="family-footer__version">Version {version}</span>
    </footer>
  )
}
