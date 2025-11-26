/**
 * Dashboard Overview Data Fetching
 * Server-side data fetching for dashboard overview with SSR optimization
 */

import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/jwt-server";
import { hasPermission } from "@/lib/auth/permissions";

/**
 * Get dashboard overview statistics
 * Returns comprehensive statistics for dashboard overview cards
 */
export const getDashboardOverviewStats = cache(async () => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return {
        success: false,
        error: "Unauthorized",
        stats: getEmptyStats(),
      };
    }

    // Get today's date range for daily comparisons
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const dayBeforeYesterday = new Date(yesterday);
    dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 1);

    // Fetch all data in parallel for optimal performance
    const [
      totalNews,
      publishedNews,
      totalUsers,
      totalRoles,
      activeAds,
      todayVisits,
      yesterdayVisits,
      todayNewsViews,
      yesterdayNewsViews,
      mostViewedNews,
    ] = await Promise.all([
      // Total news posts (with permission check)
      (async () => {
        const hasReadAllNews = await hasPermission(currentUser.userId, "news.read.all");
        const newsWhere: any = {};
        if (!hasReadAllNews) {
          newsWhere.authorId = currentUser.userId;
        }
        return await prisma.news.count({ where: newsWhere });
      })(),
      
      // Published news
      (async () => {
        const hasReadAllNews = await hasPermission(currentUser.userId, "news.read.all");
        const newsWhere: any = { isPublished: true };
        if (!hasReadAllNews) {
          newsWhere.authorId = currentUser.userId;
        }
        return await prisma.news.count({ where: newsWhere });
      })(),
      
      // Total users (check permission)
      (async () => {
        const hasReadAllUsers = await hasPermission(currentUser.userId, "user.read.all");
        if (!hasReadAllUsers) return 0;
        return await prisma.user.count();
      })(),
      
      // Total roles (check permission)
      (async () => {
        const hasReadRoles = await hasPermission(currentUser.userId, "role.read");
        if (!hasReadRoles) return 0;
        return await prisma.role.count();
      })(),
      
      // Active advertisements
      (async () => {
        const now = new Date();
        return await prisma.advertisement.count({
          where: {
            isActive: true,
            startDate: { lte: now },
            endDate: { gte: now },
          },
        });
      })(),
      
      // Today's unique visits
      (async () => {
        const visits = await prisma.visit.findMany({
          where: {
            visitedAt: { gte: today, lt: tomorrow },
          },
          select: { ipAddress: true },
        });
        return new Set(visits.map((v: any) => v.ipAddress)).size;
      })(),
      
      // Yesterday's unique visits (for comparison)
      (async () => {
        const visits = await prisma.visit.findMany({
          where: {
            visitedAt: { gte: yesterday, lt: today },
          },
          select: { ipAddress: true },
        });
        return new Set(visits.map((v: any) => v.ipAddress)).size;
      })(),
      
      // Today's news views
      prisma.newsView.count({
        where: {
          viewedAt: { gte: today, lt: tomorrow },
        },
      }),
      
      // Yesterday's news views (for comparison)
      prisma.newsView.count({
        where: {
          viewedAt: { gte: yesterday, lt: today },
        },
      }),
      
      // Most viewed news (last 7 days)
      (async () => {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const views = await prisma.newsView.groupBy({
          by: ["newsId"],
          where: {
            viewedAt: { gte: sevenDaysAgo },
          },
          _count: {
            id: true,
          },
          orderBy: {
            _count: {
              id: "desc",
            },
          },
          take: 5,
        });
        
        if (views.length === 0) return null;
        
        const newsIds = views.map((v: any) => v.newsId);
        const news = await prisma.news.findMany({
          where: { id: { in: newsIds } },
          select: {
            id: true,
            title: true,
            slug: true,
            viewCount: true,
          },
        });
        
        return news.map((n: any) => ({
          ...n,
          views: views.find((v: any) => v.newsId === n.id)?._count.id || 0,
        }));
      })(),
    ]);

    // Calculate percentage changes
    const visitChange = yesterdayVisits > 0
      ? ((todayVisits - yesterdayVisits) / yesterdayVisits) * 100
      : todayVisits > 0 ? 100 : 0;
    
    const newsViewChange = yesterdayNewsViews > 0
      ? ((todayNewsViews - yesterdayNewsViews) / yesterdayNewsViews) * 100
      : todayNewsViews > 0 ? 100 : 0;

    // Calculate growth rate (overall)
    const publishedChange = totalNews > 0
      ? ((publishedNews / totalNews) * 100)
      : 0;

    return {
      success: true,
      stats: {
        totalNews,
        publishedNews,
        totalUsers,
        totalRoles,
        activeAds,
        todayUniqueVisits: todayVisits,
        todayNewsViews,
        visitChange: parseFloat(visitChange.toFixed(1)),
        newsViewChange: parseFloat(newsViewChange.toFixed(1)),
        publishedChange: parseFloat(publishedChange.toFixed(1)),
        mostViewedNews: mostViewedNews || [],
      },
    };
  } catch (error) {
    console.error("Error fetching dashboard overview stats:", error);
    return {
      success: false,
      error: "Failed to fetch dashboard overview statistics",
      stats: getEmptyStats(),
    };
  }
});

/**
 * Get empty stats for fallback
 */
function getEmptyStats() {
  return {
    totalNews: 0,
    publishedNews: 0,
    totalUsers: 0,
    totalRoles: 0,
    activeAds: 0,
    todayUniqueVisits: 0,
    todayNewsViews: 0,
    visitChange: 0,
    newsViewChange: 0,
    publishedChange: 0,
    mostViewedNews: [],
  };
}

