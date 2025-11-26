/**
 * Top Trending News API
 * Returns most viewed news from the last 7 days
 * 
 * GET /api/news/top-trending?limit=5
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getCachedMostViewedNews } from "@/lib/services/news-api.service";
import { mapArrayToTopTrendingItems } from "@/lib/utils/category-section-mapper";

export const revalidate = 60; // Revalidate every 60 seconds

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const limitParam = searchParams.get("limit");
    const limit = limitParam
      ? Math.min(Math.max(parseInt(limitParam, 10), 1), 20)
      : 5;

    // Fetch most viewed news from last 7 days
    const news = await getCachedMostViewedNews({
      limit,
      days: 7, // Last 7 days for trending
      includeAuthor: true,
      includeCategories: true,
      includeContent: false,
    });

    // Map to TopTrendingItem format
    const trendingItems = mapArrayToTopTrendingItems(news);

    return NextResponse.json(
      {
        success: true,
        data: trendingItems,
        meta: {
          count: trendingItems.length,
          period: "7 days",
          timestamp: new Date().toISOString(),
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (error) {
    console.error("Top trending news API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch top trending news",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

