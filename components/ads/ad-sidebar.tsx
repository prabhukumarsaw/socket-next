/**
 * Ad Sidebar Component
 * Vertical sidebar advertisement component
 */

import { AdBanner } from "./ad-banner";
import { getActiveAdsByZone, getDefaultAd, type AdDisplay } from "@/lib/services/ads.service";
import { Suspense } from "react";

interface AdSidebarProps {
  className?: string;
  limit?: number;
  showDefault?: boolean;
  position?: number; // Position index (0-based) to display specific ad
}

async function AdSidebarContent({ showDefault = true, position = 0 }: { showDefault: boolean; position: number }) {
  let ad: AdDisplay | null = null;
  
  try {
    const ads = await getActiveAdsByZone("sidebar", 5); // Fetch up to 5 ads
    ad = ads[position] || null;
  } catch (error) {
    console.error("Error loading sidebar ad:", error);
  }

  // Always show default if no ad found and showDefault is true
  if (!ad && showDefault) {
    ad = getDefaultAd("sidebar");
  }

  if (!ad) {
    return null;
  }

  return <AdBanner ad={ad} size="sidebar" />;
}

export function AdSidebar({ className, limit = 1, showDefault = true, position = 0 }: AdSidebarProps) {
  return (
    <div className={className}>
      <Suspense
        fallback={
          <div className="w-full aspect-[3/4] max-w-[300px] bg-muted rounded-lg animate-pulse border border-border" />
        }
      >
        <AdSidebarContent showDefault={showDefault} position={position} />
      </Suspense>
    </div>
  );
}

