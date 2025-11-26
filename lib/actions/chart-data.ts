/**
 * Chart Data Actions
 * Server-side data fetching for dashboard charts
 */

import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/jwt-server";
import { hasPermission } from "@/lib/auth/permissions";

/**
 * Get daily news post counts for the last 30 days
 */
export const getDailyNewsPostCounts = cache(async (days: number = 30) => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized", data: [] };
    }

    const hasReadAllNews = await hasPermission(currentUser.userId, "news.read.all");
    const newsWhere: any = {};
    if (!hasReadAllNews) {
      newsWhere.authorId = currentUser.userId;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Get all news posts in the date range
    const news = await prisma.news.findMany({
      where: {
        ...newsWhere,
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Group by date
    const dailyCounts: Record<string, number> = {};
    news.forEach((item: any) => {
      const date = item.createdAt.toISOString().split("T")[0];
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });

    // Fill in missing dates with 0
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dateStr = date.toISOString().split("T")[0];
      result.push({
        date: dateStr,
        count: dailyCounts[dateStr] || 0,
      });
    }

    return {
      success: true,
      data: result,
      total: news.length,
    };
  } catch (error) {
    console.error("Error fetching daily news post counts:", error);
    return { success: false, error: "Failed to fetch daily news post counts", data: [] };
  }
});

/**
 * Get news posts by author distribution
 */
export const getNewsByAuthorDistribution = cache(async () => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized", data: [] };
    }

    const hasReadAllNews = await hasPermission(currentUser.userId, "news.read.all");
    const newsWhere: any = {};
    if (!hasReadAllNews) {
      newsWhere.authorId = currentUser.userId;
    }

    // Get news posts with author info
    const news = await prisma.news.findMany({
      where: newsWhere,
      select: {
        id: true,
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    // Helper function to get display name
    const getDisplayName = (author: {
      firstName?: string | null;
      lastName?: string | null;
      username?: string;
      email?: string;
    } | null) => {
      if (!author) return "Unknown Author";
      if (author.firstName || author.lastName) {
        return [author.firstName, author.lastName].filter(Boolean).join(" ").trim();
      }
      return author.username || author.email || "Unknown Author";
    };

    // Group by author
    const authorCounts: Record<string, { count: number; author: any }> = {};
    news.forEach((item: any) => {
      const authorId = item.author?.id || "unknown";
      const authorName = getDisplayName(item.author);
      
      if (!authorCounts[authorId]) {
        authorCounts[authorId] = {
          count: 0,
          author: {
            id: authorId,
            name: authorName,
            email: item.author?.email || "",
            avatar: item.author?.avatar || "",
          },
        };
      }
      authorCounts[authorId].count++;
    });

    // Convert to array and sort by count
    const result = Object.values(authorCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5) // Top 5 authors
      .map((item) => ({
        author: item.author.name,
        count: item.count,
        fill: "var(--primary)", // Will be set by component
      }));

    return {
      success: true,
      data: result,
      total: news.length,
    };
  } catch (error) {
    console.error("Error fetching news by author distribution:", error);
    return { success: false, error: "Failed to fetch author distribution", data: [] };
  }
});

/**
 * Get stacked area chart data - News views by device type
 */
export const getNewsViewsByDeviceType = cache(async (days: number = 30) => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized", data: [] };
    }

    const hasAccess = await hasPermission(currentUser.userId, "analytics.read");
    if (!hasAccess) {
      return { success: false, error: "No permission", data: [] };
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Get visits with device info
    const visits = await prisma.visit.findMany({
      where: {
        visitedAt: {
          gte: startDate,
        },
        path: {
          startsWith: "/news/",
        },
      },
      select: {
        visitedAt: true,
        device: true,
      },
    });

    // Group by date and device type
    const dailyDeviceCounts: Record<string, Record<string, number>> = {};
    
    visits.forEach((visit: any) => {
      const date = visit.visitedAt.toISOString().split("T")[0];
      const device = visit.device || "unknown";
      
      if (!dailyDeviceCounts[date]) {
        dailyDeviceCounts[date] = {};
      }
      dailyDeviceCounts[date][device] = (dailyDeviceCounts[date][device] || 0) + 1;
    });

    // Fill in missing dates and normalize device names
    const result = [];
    const deviceTypes = ["desktop", "mobile", "tablet"];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dateStr = date.toISOString().split("T")[0];
      
      const dateData: any = {
        date: dateStr,
        month: date.toLocaleDateString("en-US", { month: "short" }),
      };

      // Initialize all device types to 0
      deviceTypes.forEach((device: any) => {
        dateData[device] = 0;
      });

      // Add actual counts
      if (dailyDeviceCounts[dateStr]) {
        Object.entries(dailyDeviceCounts[dateStr]).forEach(([device, count]) => {
          const normalizedDevice = device.toLowerCase().includes("mobile") || device.toLowerCase().includes("phone")
            ? "mobile"
            : device.toLowerCase().includes("tablet")
            ? "tablet"
            : "desktop";
          dateData[normalizedDevice] = (dateData[normalizedDevice] || 0) + (count as number);
        });
      }

      result.push(dateData);
    }

    return {
      success: true,
      data: result,
      total: visits.length,
    };
  } catch (error) {
    console.error("Error fetching news views by device type:", error);
    return { success: false, error: "Failed to fetch device type data", data: [] };
  }
});

/**
 * Get top/recent news posts for Recent Sales component
 */
export const getTopRecentNews = cache(async (limit: number = 5) => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized", data: [] };
    }

    const hasReadAllNews = await hasPermission(currentUser.userId, "news.read.all");
    const newsWhere: any = {};
    if (!hasReadAllNews) {
      newsWhere.authorId = currentUser.userId;
    }

    // Get most viewed news posts
    const news = await prisma.news.findMany({
      where: newsWhere,
      select: {
        id: true,
        title: true,
        slug: true,
        viewCount: true,
        coverImage: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        viewCount: "desc",
      },
      take: limit,
    });

    // Helper function to get display name
    const getDisplayName = (author: {
      firstName?: string | null;
      lastName?: string | null;
      username?: string;
      email?: string;
    } | null) => {
      if (!author) return "Unknown";
      if (author.firstName || author.lastName) {
        return [author.firstName, author.lastName].filter(Boolean).join(" ").trim();
      }
      return author.username || author.email || "Unknown";
    };

    // Helper function to get initials for avatar fallback
    const getInitials = (author: {
      firstName?: string | null;
      lastName?: string | null;
      username?: string;
      email?: string;
    } | null) => {
      if (!author) return "U";
      if (author.firstName || author.lastName) {
        return [author.firstName?.[0], author.lastName?.[0]]
          .filter(Boolean)
          .join("")
          .toUpperCase()
          .slice(0, 2);
      }
      return (author.username || author.email || "U").charAt(0).toUpperCase();
    };

    const result = news.map((item: any) => {
      const authorName = getDisplayName(item.author);
      return {
        id: item.id,
        title: item.title,
        slug: item.slug,
        views: item.viewCount || 0,
        author: {
          name: authorName,
          email: item.author?.email || "",
          image: item.author?.avatar || "",
          fallback: getInitials(item.author),
        },
        createdAt: item.createdAt,
        coverImage: item.coverImage,
      };
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Error fetching top recent news:", error);
    return { success: false, error: "Failed to fetch top recent news", data: [] };
  }
});

