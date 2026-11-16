import { FamilyBrand } from './FamilyBrand'
import { useReleaseVersion } from './useReleaseVersion'
import './FamilyFooter.css'

export function FamilyFooter({ showBrand = true }: { showBrand?: boolean }) {
  const version = useReleaseVersion()
  return (
    <footer className="family-footer">
      {showBrand && <FamilyBrand variant="shield" size="small" />}
      <div className="family-footer__copy">
        <p className="family-footer__tagline">A private space for the people who matter.</p>
      </div>
      <div className="family-footer__meta">
        <p className="family-footer__hosting">
          Hosted by{' '}
          <a
            href="https://www.trilogywebsolutions.co.uk/clients/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Trilogy Web Solutions
          </a>
        </p>
        <span className="family-footer__version">Version {version}</span>
      </div>
    </footer>
  )
}
