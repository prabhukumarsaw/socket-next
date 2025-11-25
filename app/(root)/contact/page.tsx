import { Metadata } from "next"
import { StaticPageLayout } from "@/components/static-pages/static-page-layout"
import { staticPagesData } from "@/lib/data/static-pages"

export const metadata: Metadata = {
  title: "Contact Us | Bawal News",
  description: staticPagesData.contact.description,
  openGraph: {
    title: "Contact Us | Bawal News",
    description: staticPagesData.contact.description,
    type: "website",
  },
}

export default function ContactPage() {
  return (
    <StaticPageLayout
      title={staticPagesData.contact.title}
      description={staticPagesData.contact.description}
      sections={staticPagesData.contact.sections}
    />
  )
}

