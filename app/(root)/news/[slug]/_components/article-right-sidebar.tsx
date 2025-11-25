import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LiveScoreWidget } from "@/components/widgets/live-score"
import { AdBanner } from "@/components/ads/ad-banner"
import { getActiveAdsByZone, getDefaultAd, type AdDisplay } from "@/lib/services/ads.service"
import { Activity } from "lucide-react"

// Top Banner Ad Component
async function TopBannerAd() {
  let ad: AdDisplay | null = null
  
  try {
    const ads = await getActiveAdsByZone("sidebar", 3)
    ad = ads[0] || null
  } catch (error) {
    console.error("Error loading top banner ad:", error)
  }

  if (!ad) {
    ad = getDefaultAd("sidebar")
  }

  return (
    <div className="w-full max-w-full">
      <AdBanner ad={ad} size="sidebar" showLabel={true} />
    </div>
  )
}

// Card Ad Component
async function CardAd({ position = 1 }: { position?: number }) {
  let ad: AdDisplay | null = null
  
  try {
    const ads = await getActiveAdsByZone("sidebar", 5)
    ad = ads[position] || null
  } catch (error) {
    console.error("Error loading card ad:", error)
  }

  if (!ad) {
    ad = getDefaultAd("sidebar")
  }

  return (
    <Card className="border-2 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <AdBanner ad={ad} size="sidebar" showLabel={true} />
      </CardContent>
    </Card>
  )
}

// Bottom Banner Ad Component
async function BottomBannerAd() {
  let ad: AdDisplay | null = null
  
  try {
    const ads = await getActiveAdsByZone("sidebar", 3)
    ad = ads[2] || null
  } catch (error) {
    console.error("Error loading bottom banner ad:", error)
  }

  if (!ad) {
    ad = getDefaultAd("sidebar")
  }

  return (
    <div className="w-full max-w-full">
      <AdBanner ad={ad} size="sidebar" showLabel={true} />
    </div>
  )
}

export async function ArticleRightSidebar() {
  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      {/* Top Banner Ad */}
      <Suspense
        fallback={
          <div className="w-full aspect-[3/4] max-w-full bg-muted rounded-lg animate-pulse border border-border" />
        }
      >
        <TopBannerAd />
      </Suspense>

      {/* Live Scores Section */}
      <Card className="border shadow-sm overflow-hidden w-full">
        <CardHeader className="pb-3 px-4 sm:px-6">
          <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
            <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            Live Scores
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <LiveScoreWidget />
        </CardContent>
      </Card>

      {/* Card Ad 1 */}
      <Suspense
        fallback={
          <div className="w-full aspect-[3/4] max-w-full bg-muted rounded-lg animate-pulse border border-border" />
        }
      >
        <CardAd position={1} />
      </Suspense>

      {/* Card Ad 2 */}
      <Suspense
        fallback={
          <div className="w-full aspect-[3/4] max-w-full bg-muted rounded-lg animate-pulse border border-border" />
        }
      >
        <CardAd position={2} />
      </Suspense>

      {/* Bottom Banner Ad */}
      <Suspense
        fallback={
          <div className="w-full aspect-[3/4] max-w-full bg-muted rounded-lg animate-pulse border border-border" />
        }
      >
        <BottomBannerAd />
      </Suspense>
    </div>
  )
}

