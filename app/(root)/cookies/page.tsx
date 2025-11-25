import { Metadata } from "next"
import { StaticPageLayout } from "@/components/static-pages/static-page-layout"
import { staticPagesData } from "@/lib/data/static-pages"

export const metadata: Metadata = {
  title: "Cookie Policy | Bawal News",
  description: staticPagesData.cookies.description,
  openGraph: {
    title: "Cookie Policy | Bawal News",
    description: staticPagesData.cookies.description,
    type: "website",
  },
}

export default function CookiesPage() {
  return (
    <StaticPageLayout
      title={staticPagesData.cookies.title}
      description={staticPagesData.cookies.description}
      sections={staticPagesData.cookies.sections}
      lastUpdated={staticPagesData.cookies.lastUpdated}
    />
  )
}

