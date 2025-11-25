import { Metadata } from "next"
import { StaticPageLayout } from "@/components/static-pages/static-page-layout"
import { staticPagesData } from "@/lib/data/static-pages"

export const metadata: Metadata = {
  title: "Terms and Conditions | Bawal News",
  description: staticPagesData.terms.description,
  openGraph: {
    title: "Terms and Conditions | Bawal News",
    description: staticPagesData.terms.description,
    type: "website",
  },
}

export default function TermsPage() {
  return (
    <StaticPageLayout
      title={staticPagesData.terms.title}
      description={staticPagesData.terms.description}
      sections={staticPagesData.terms.sections}
      lastUpdated={staticPagesData.terms.lastUpdated}
    />
  )
}

