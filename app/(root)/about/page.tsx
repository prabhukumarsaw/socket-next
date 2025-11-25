import { Metadata } from "next"
import { StaticPageLayout } from "@/components/static-pages/static-page-layout"
import { staticPagesData } from "@/lib/data/static-pages"

export const metadata: Metadata = {
  title: "About Us | Bawal News",
  description: staticPagesData.about.description,
  openGraph: {
    title: "About Us | Bawal News",
    description: staticPagesData.about.description,
    type: "website",
  },
}

export default function AboutPage() {
  return (
    <StaticPageLayout
      title={staticPagesData.about.title}
      description={staticPagesData.about.description}
      sections={staticPagesData.about.sections}
    />
  )
}

