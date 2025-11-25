import type React from "react"
import { NewsSidebar } from "@/components/news/sidebar"
import { AdLeaderboard } from "@/components/ads/ad-leaderboard"

// High-performance layout with stable design
export default function CategoryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="">
      {/* Top Ad Slot - Enterprise Requirement: Stable placement */}
      <div className="w-full bg-[#0a0a0a] py-4 border-b border-zinc-900 flex justify-center items-center">
        <AdLeaderboard showDefault={true} />
      </div>

      <main className="max-w-[90rem] justify-center mx-auto px-4 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content Area (Left 75% - per requirement) */}
          <div className="w-full lg:w-3/4">{children}</div>

          {/* Feature Sidebar (Right 25% - per requirement) */}
          <div className="w-full lg:w-1/4 space-y-8">
            <NewsSidebar />
          </div>
        </div>
      </main>

      {/* Bottom Ad Slot */}
      <div className="w-full bg-[#0a0a0a] py-8 border-t border-zinc-900 flex justify-center items-center mt-12">
        <AdLeaderboard showDefault={true} />
      </div>
    </div>
    // </div>
    // </PageContainer>
  )
}
