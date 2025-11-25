/**
 * Ad Inline Component
 * Inline advertisement component for content areas
 */

import { AdBanner } from "./ad-banner";
import { getActiveAdsByZone, getDefaultAd, type AdDisplay } from "@/lib/services/ads.service";
import { Suspense } from "react";

interface AdInlineProps {
  className?: string;
  showDefault?: boolean;
}

async function AdInlineContent({ showDefault = true }: { showDefault: boolean }) {
  let ad: AdDisplay | null = null;
  
  try {
    const ads = await getActiveAdsByZone("inline", 1);
    ad = ads[0] || null;
  } catch (error) {
    console.error("Error loading inline ad:", error);
  }

  // Always show default if no ad found and showDefault is true
  if (!ad && showDefault) {
    ad = getDefaultAd("inline");
  }

  if (!ad) {
    return null;
  }

  return <AdBanner ad={ad} size="medium" />;
}

export function AdInline({ className, showDefault = true }: AdInlineProps) {
  return (
    <div className={className}>
      <Suspense
        fallback={
          <div className="w-full h-48 bg-muted rounded-lg animate-pulse border border-border" />
        }
      >
        <AdInlineContent showDefault={showDefault} />
      </Suspense>
    </div>
  );
}

