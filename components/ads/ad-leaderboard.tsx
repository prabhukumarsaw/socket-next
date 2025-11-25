/**
 * Ad Leaderboard Component
 * Horizontal leaderboard advertisement (970x90)
 */

import { AdBanner } from "./ad-banner";
import { getActiveAdsByZone, getDefaultAd, type AdDisplay } from "@/lib/services/ads.service";
import { Suspense } from "react";

interface AdLeaderboardProps {
  className?: string;
  showDefault?: boolean;
}

async function AdLeaderboardContent({ showDefault = true }: { showDefault: boolean }) {
  let ad: AdDisplay | null = null;
  
  try {
    const ads = await getActiveAdsByZone("header", 1);
    ad = ads[0] || null;
  } catch (error) {
    console.error("Error loading leaderboard ad:", error);
  }

  // Always show default if no ad found and showDefault is true
  if (!ad && showDefault) {
    ad = getDefaultAd("header");
  }

  if (!ad) {
    return null;
  }

  return (
    <div className="flex justify-center w-full">
      <AdBanner ad={ad} size="leaderboard" showLabel={true} />
    </div>
  );
}

export function AdLeaderboard({ className, showDefault = true }: AdLeaderboardProps) {
  return (
    <div className={className}>
      <Suspense
        fallback={
          <div className="w-full max-w-[970px] h-[90px] bg-muted rounded-lg animate-pulse mx-auto border border-border" />
        }
      >
        <AdLeaderboardContent showDefault={showDefault} />
      </Suspense>
    </div>
  );
}

