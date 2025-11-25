import { AdInline } from "./ad-inline"

/**
 * Main Ads Component
 * Displays inline advertisement on home page
 */
export default function Ads() {
  return (
    <section className="container mx-auto px-4 py-8">
      <AdInline showDefault={true} />
    </section>
  )
}
