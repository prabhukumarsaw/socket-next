import { Metadata } from "next"
import { StaticPageLayout } from "@/components/static-pages/static-page-layout"
import { staticPagesData } from "@/lib/data/static-pages"

export const metadata: Metadata = {
  title: "DMCA Policy | Bawal News",
  description: staticPagesData.dmca.description,
  openGraph: {
    title: "DMCA Policy | Bawal News",
    description: staticPagesData.dmca.description,
    type: "website",
  },
}

export default function DMCAPage() {
  return (
    <StaticPageLayout
      title={staticPagesData.dmca.title}
      description={staticPagesData.dmca.description}
      sections={staticPagesData.dmca.sections}
    />
  )
}

