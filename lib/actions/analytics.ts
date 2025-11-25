"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/jwt-server";
import { hasPermission } from "@/lib/auth/permissions";
import { headers } from "next/headers";

/**
 * Analytics Server Actions
 * Handles visit tracking, news analytics, and dashboard statistics
 */

/**
 * Track a visit (public API - no auth required)
 */
export async function trackVisit(path: string, referer?: string) {
  try {
    const headersList = await headers();
    const ipAddress =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headersList.get("x-real-ip") ||
      headersList.get("cf-connecting-ip") ||
      "unknown";
    const userAgent = headersList.get("user-agent") || "unknown";

    await prisma.visit.create({
      data: {
        ipAddress,
        userAgent,
        referer: referer || null,
        path,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Track visit error:", error);
    return { success: false, error: "Failed to track visit" };
  }
}

/**
 * Get daily visit statistics
 */
export async function getDailyVisits(days: number = 30) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const hasAccess = await hasPermission(currentUser.userId, "analytics.read");
    if (!hasAccess) {
      return {
        success: false,
        error: "You don't have permission to view analytics",
      };
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get unique daily visits by IP
    const visits = await prisma.visit.findMany({
      where: {
        visitedAt: {
          gte: startDate,
        },
      },
      select: {
        ipAddress: true,
        visitedAt: true,
      },
    });

    // Group by date and count unique IPs
    const dailyStats: Record<string, Set<string>> = {};
    visits.forEach((visit) => {
      const date = visit.visitedAt.toISOString().split("T")[0];
      if (!dailyStats[date]) {
        dailyStats[date] = new Set();
      }
      dailyStats[date].add(visit.ipAddress);
    });

    // Convert to array format
    const result = Object.entries(dailyStats).map(([date, ipSet]) => ({
      date,
      uniqueVisits: ipSet.size,
      totalVisits: visits.filter((v) => v.visitedAt.toISOString().split("T")[0] === date).length,
    }));

    result.sort((a, b) => a.date.localeCompare(b.date));

    return {
      success: true,
      stats: result,
      totalUniqueVisits: new Set(visits.map((v) => v.ipAddress)).size,
      totalVisits: visits.length,
    };
  } catch (error) {
    console.error("Get daily visits error:", error);
    return { success: false, error: "Failed to fetch visit statistics" };
  }
}

/**
 * Get news post statistics
 */
export async function getNewsStatistics(days: number = 30) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const hasAccess = await hasPermission(currentUser.userId, "analytics.read");
    if (!hasAccess) {
      return {
        success: false,
        error: "You don't have permission to view analytics",
      };
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get news views
    const views = await prisma.newsView.findMany({
      where: {
        viewedAt: {
          gte: startDate,
        },
      },
      include: {
        news: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    // Group by date
    const dailyStats: Record<string, number> = {};
    views.forEach((view) => {
      const date = view.viewedAt.toISOString().split("T")[0];
      dailyStats[date] = (dailyStats[date] || 0) + 1;
    });

    // Convert to array format
    const result = Object.entries(dailyStats).map(([date, count]) => ({
      date,
      views: count,
    }));

    result.sort((a, b) => a.date.localeCompare(b.date));

    // Get top news posts
    const newsViewCounts: Record<string, { count: number; news: any }> = {};
    views.forEach((view) => {
      const newsId = view.newsId;
      if (!newsViewCounts[newsId]) {
        newsViewCounts[newsId] = {
          count: 0,
          news: view.news,
        };
      }
      newsViewCounts[newsId].count++;
    });

    const topNews = Object.values(newsViewCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      success: true,
      dailyStats: result,
      topNews,
      totalViews: views.length,
      uniqueNewsPosts: Object.keys(newsViewCounts).length,
    };
  } catch (error) {
    console.error("Get news statistics error:", error);
    return { success: false, error: "Failed to fetch news statistics" };
  }
}

/**
 * Get dashboard overview statistics
 */
export async function getDashboardOverview() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const hasAccess = await hasPermission(currentUser.userId, "analytics.read");
    if (!hasAccess) {
      return {
        success: false,
        error: "You don't have permission to view analytics",
      };
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Today's unique visits
    const todayVisits = await prisma.visit.findMany({
      where: {
        visitedAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });
    const todayUniqueVisits = new Set(todayVisits.map((v) => v.ipAddress)).size;

    // Total news posts
    const hasReadAllNews = await hasPermission(currentUser.userId, "news.read.all");
    const newsWhere: any = {};
    if (!hasReadAllNews) {
      newsWhere.authorId = currentUser.userId;
    }
    const totalNews = await prisma.news.count({ where: newsWhere });
    const publishedNews = await prisma.news.count({
      where: { ...newsWhere, isPublished: true },
    });

    // Today's news views
    const todayNewsViews = await prisma.newsView.count({
      where: {
        viewedAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // Active advertisements
    const now = new Date();
    const activeAds = await prisma.advertisement.count({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });

    // Total media files
    const hasReadAllMedia = await hasPermission(currentUser.userId, "media.read.all");
    const mediaWhere: any = {};
    if (!hasReadAllMedia) {
      mediaWhere.uploadedBy = currentUser.userId;
    }
    const totalMedia = await prisma.media.count({ where: mediaWhere });

    return {
      success: true,
      overview: {
        todayUniqueVisits: todayUniqueVisits,
        todayTotalVisits: todayVisits.length,
        todayNewsViews,
        totalNews,
        publishedNews,
        activeAds,
        totalMedia,
      },
    };
  } catch (error) {
    console.error("Get dashboard overview error:", error);
    return { success: false, error: "Failed to fetch dashboard overview" };
  }
}

/**
 * Get advertisement statistics
 */
export async function getAdvertisementStatistics(days: number = 30) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const hasAccess = await hasPermission(currentUser.userId, "analytics.read");
    if (!hasAccess) {
      return {
        success: false,
        error: "You don't have permission to view analytics",
      };
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const advertisements = await prisma.advertisement.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      include: {
        _count: {
          select: {
            news: true,
          },
        },
      },
    });

    // Calculate CTR and performance
    const adStats = advertisements.map((ad) => {
      const ctr = ad.impressions > 0 ? (ad.clicks / ad.impressions) * 100 : 0;
      return {
        id: ad.id,
        title: ad.title,
        clicks: ad.clicks,
        impressions: ad.impressions,
        ctr: ctr.toFixed(2),
        zone: ad.zone,
        isActive: ad.isActive,
      };
    });

    // Group by zone
    const zoneStats: Record<string, { clicks: number; impressions: number }> = {};
    advertisements.forEach((ad) => {
      if (!zoneStats[ad.zone]) {
        zoneStats[ad.zone] = { clicks: 0, impressions: 0 };
      }
      zoneStats[ad.zone].clicks += ad.clicks;
      zoneStats[ad.zone].impressions += ad.impressions;
    });

    return {
      success: true,
      advertisements: adStats.sort((a, b) => b.clicks - a.clicks),
      zoneStats: Object.entries(zoneStats).map(([zone, stats]) => ({
        zone,
        clicks: stats.clicks,
        impressions: stats.impressions,
        ctr: stats.impressions > 0 ? ((stats.clicks / stats.impressions) * 100).toFixed(2) : "0.00",
      })),
      totalClicks: advertisements.reduce((sum, ad) => sum + ad.clicks, 0),
      totalImpressions: advertisements.reduce((sum, ad) => sum + ad.impressions, 0),
    };
  } catch (error) {
    console.error("Get advertisement statistics error:", error);
    return { success: false, error: "Failed to fetch advertisement statistics" };
  }
}

/**
 * Get device and browser statistics
 */
export async function getDeviceStatistics(days: number = 30) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const hasAccess = await hasPermission(currentUser.userId, "analytics.read");
    if (!hasAccess) {
      return {
        success: false,
        error: "You don't have permission to view analytics",
      };
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const visits = await prisma.visit.findMany({
      where: {
        visitedAt: {
          gte: startDate,
        },
      },
      select: {
        device: true,
        browser: true,
        os: true,
      },
    });

    // Count devices
    const deviceCounts: Record<string, number> = {};
    visits.forEach((visit) => {
      const device = visit.device || "Unknown";
      deviceCounts[device] = (deviceCounts[device] || 0) + 1;
    });

    // Count browsers
    const browserCounts: Record<string, number> = {};
    visits.forEach((visit) => {
      const browser = visit.browser || "Unknown";
      browserCounts[browser] = (browserCounts[browser] || 0) + 1;
    });

    // Count OS
    const osCounts: Record<string, number> = {};
    visits.forEach((visit) => {
      const os = visit.os || "Unknown";
      osCounts[os] = (osCounts[os] || 0) + 1;
    });

    return {
      success: true,
      devices: Object.entries(deviceCounts)
        .map(([device, count]) => ({ device, count }))
        .sort((a, b) => b.count - a.count),
      browsers: Object.entries(browserCounts)
        .map(([browser, count]) => ({ browser, count }))
        .sort((a, b) => b.count - a.count),
      os: Object.entries(osCounts)
        .map(([os, count]) => ({ os, count }))
        .sort((a, b) => b.count - a.count),
    };
  } catch (error) {
    console.error("Get device statistics error:", error);
    return { success: false, error: "Failed to fetch device statistics" };
  }
}

/**
 * Get comprehensive analytics dashboard data
 */
export async function getAnalyticsDashboard(days: number = 30) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const hasAccess = await hasPermission(currentUser.userId, "analytics.read");
    if (!hasAccess) {
      return {
        success: false,
        error: "You don't have permission to view analytics",
      };
    }

    // Get all analytics data in parallel
    const [visitsResult, newsResult, adsResult, deviceResult, overviewResult] = await Promise.all([
      getDailyVisits(days),
      getNewsStatistics(days),
      getAdvertisementStatistics(days),
      getDeviceStatistics(days),
      getDashboardOverview(),
    ]);

    return {
      success: true,
      visits: visitsResult.success ? visitsResult : null,
      news: newsResult.success ? newsResult : null,
      advertisements: adsResult.success ? adsResult : null,
      devices: deviceResult.success ? deviceResult : null,
      overview: overviewResult.success ? overviewResult.overview : null,
    };
  } catch (error) {
    console.error("Get analytics dashboard error:", error);
    return { success: false, error: "Failed to fetch analytics dashboard" };
  }
}

