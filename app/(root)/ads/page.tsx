import { Metadata } from "next"
import { StaticPageLayout } from "@/components/static-pages/static-page-layout"
import { staticPagesData } from "@/lib/data/static-pages"

export const metadata: Metadata = {
  title: "Advertising | Bawal News",
  description: staticPagesData.ads.description,
  openGraph: {
    title: "Advertising | Bawal News",
    description: staticPagesData.ads.description,
    type: "website",
  },
}

export default function AdsPage() {
  return (
    <StaticPageLayout
      title={staticPagesData.ads.title}
      description={staticPagesData.ads.description}
      sections={staticPagesData.ads.sections}
    />
  )
}

