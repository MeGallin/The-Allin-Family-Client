import { FamilyBrand } from './FamilyBrand'
import './FamilyFooter.css'

export function FamilyFooter({ showBrand = true }: { showBrand?: boolean }) {
  return (
    <footer className="family-footer">
      {showBrand && <FamilyBrand variant="shield" size="small" />}
      <p>A private space for the people who matter.</p>
    </footer>
  )
}
