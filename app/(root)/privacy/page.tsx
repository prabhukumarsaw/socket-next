import { Metadata } from "next"
import { StaticPageLayout } from "@/components/static-pages/static-page-layout"
import { staticPagesData } from "@/lib/data/static-pages"

export const metadata: Metadata = {
  title: "Privacy Policy | Bawal News",
  description: staticPagesData.privacy.description,
  openGraph: {
    title: "Privacy Policy | Bawal News",
    description: staticPagesData.privacy.description,
    type: "website",
  },
}

export default function PrivacyPage() {
  return (
    <StaticPageLayout
      title={staticPagesData.privacy.title}
      description={staticPagesData.privacy.description}
      sections={staticPagesData.privacy.sections}
      lastUpdated={staticPagesData.privacy.lastUpdated}
    />
  )
}

