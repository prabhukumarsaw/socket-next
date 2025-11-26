import type React from "react"
import type { Metadata } from "next"
import { ArticleSidebar } from "./_components/article-sidebar"
import { ArticleRightSidebar } from "./_components/article-right-sidebar"

export const metadata: Metadata = {
  title: "News Article | Modern News Platform",
  description: "Latest news updates and detailed analysis",
}

// This layout handles the 2-column structure (75% Content / 25% Sidebar)
// It provides a stable structure for all news details
export default function ArticleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-[90rem] justify-center mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Main Content Area - 75% width on desktop */}
          <main className="w-full lg:w-3/4">{children}</main>

          {/* Sidebar Area - 25% width on desktop */}
          {/* Sticky sidebar logic: sticky top-8 so it stays visible while scrolling */}
          <aside className="w-full lg:w-1/4 space-y-8">
            <div className="lg:sticky lg:top-8">
              <ArticleSidebar />
              {/* <ArticleRightSidebar /> */}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
