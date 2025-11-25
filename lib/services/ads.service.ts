/**
 * Advertisement Service
 * Server-side service for fetching active advertisements with caching
 * Optimized for high traffic (1k+ daily users)
 */

import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export interface AdDisplay {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  linkUrl: string | null;
  zone: string;
  position: number;
  newsId: string | null;
  newsSlug?: string | null;
}

/**
 * Get active advertisements for a specific zone
 * Cached for 5 minutes to optimize performance
 */
async function fetchActiveAdsByZone(zone: string, limit: number = 5): Promise<AdDisplay[]> {
  const now = new Date();
  
  try {
    const ads = await prisma.advertisement.findMany({
      where: {
        zone,
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: [
        { position: "asc" },
        { createdAt: "desc" },
      ],
      take: limit,
      include: {
        news: {
          select: {
            slug: true,
          },
        },
      },
    });

    return ads.map((ad) => ({
      id: ad.id,
      title: ad.title,
      description: ad.description,
      imageUrl: ad.imageUrl,
      linkUrl: ad.linkUrl,
      zone: ad.zone,
      position: ad.position,
      newsId: ad.newsId,
      newsSlug: ad.news?.slug || null,
    }));
  } catch (error) {
    console.error(`Error fetching ads for zone ${zone}:`, error);
    return [];
  }
}

/**
 * Cached version for server-side rendering
 */
export const getActiveAdsByZone = cache(async (zone: string, limit: number = 5): Promise<AdDisplay[]> => {
  return await unstable_cache(
    () => fetchActiveAdsByZone(zone, limit),
    [`ads-zone-${zone}-${limit}`],
    {
      revalidate: 300, // 5 minutes cache
      tags: [`ads-zone-${zone}`],
    }
  )();
});

/**
 * Get default/dummy ad for fallback
 */
export function getDefaultAd(zone: string): AdDisplay {
  // Default ads based on zone - using proper placeholder URLs
  const defaultAds: Record<string, AdDisplay> = {
    header: {
      id: "default-header",
      title: "Advertisement Space Available",
      description: "Premium advertising space available. Contact us to advertise here.",
      imageUrl: "https://via.placeholder.com/970x90/1e293b/94a3b8?text=Advertisement+Space",
      linkUrl: null,
      zone: "header",
      position: 0,
      newsId: null,
    },
    sidebar: {
      id: "default-sidebar",
      title: "Advertisement",
      description: "Connect with our audience. Advertise here.",
      imageUrl: "https://via.placeholder.com/300x400/1e293b/94a3b8?text=Ad",
      linkUrl: null,
      zone: "sidebar",
      position: 0,
      newsId: null,
    },
    footer: {
      id: "default-footer",
      title: "Advertisement Space",
      description: "Footer advertising opportunity",
      imageUrl: "https://via.placeholder.com/728x90/1e293b/94a3b8?text=Advertisement",
      linkUrl: null,
      zone: "footer",
      position: 0,
      newsId: null,
    },
    inline: {
      id: "default-inline",
      title: "Advertisement",
      description: "Promote your brand here. Contact us for advertising opportunities.",
      imageUrl: "https://via.placeholder.com/600x200/1e293b/94a3b8?text=Advertisement",
      linkUrl: null,
      zone: "inline",
      position: 0,
      newsId: null,
    },
    popup: {
      id: "default-popup",
      title: "Advertisement",
      description: "Popup advertisement space available",
      imageUrl: "https://via.placeholder.com/400x300/1e293b/94a3b8?text=Popup+Ad",
      linkUrl: null,
      zone: "popup",
      position: 0,
      newsId: null,
    },
  };

  return defaultAds[zone] || defaultAds.sidebar;
}

/**
 * Track ad impression (for analytics)
 */
export async function trackAdImpression(adId: string) {
  try {
    await prisma.advertisement.update({
      where: { id: adId },
      data: {
        impressions: {
          increment: 1,
        },
      },
    });
  } catch (error) {
    console.error("Error tracking ad impression:", error);
    // Don't throw - tracking failure shouldn't break the page
  }
}

/**
 * Track ad click (for analytics)
 */
export async function trackAdClick(adId: string) {
  try {
    await prisma.advertisement.update({
      where: { id: adId },
      data: {
        clicks: {
          increment: 1,
        },
      },
    });
  } catch (error) {
    console.error("Error tracking ad click:", error);
    // Don't throw - tracking failure shouldn't break the page
  }
}

