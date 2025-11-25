/**
 * Most Viewed News API Endpoint
 * 
 * GET /api/news/most-viewed
 * 
 * Returns most viewed news articles sorted by view count
 * 
 * Query Parameters:
 * - limit: number of results (default: 10, max: 50)
 * - days: number of days to look back (default: 30, max: 365)
 * - includeContent: include full content (default: false)
 * 
 * Response:
 * {
 *   success: boolean,
 *   data: NewsResponse[],
 *   meta: {
 *     count: number,
 *     days: number,
 *     timestamp: string
 *   }
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { getCachedMostViewedNews } from "@/lib/services/news-api.service";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const limitParam = searchParams.get("limit");
    const limit = limitParam
      ? Math.min(Math.max(parseInt(limitParam, 10), 1), 50)
      : 10;

    const daysParam = searchParams.get("days");
    const days = daysParam
      ? Math.min(Math.max(parseInt(daysParam, 10), 1), 365)
      : 30;

    const includeContent = searchParams.get("includeContent") === "true";

    const news = await getCachedMostViewedNews({
      limit,
      days,
      includeContent,
      includeAuthor: true,
      includeCategories: true,
    });

    return NextResponse.json(
      {
        success: true,
        data: news,
        meta: {
          count: news.length,
          days,
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
    console.error("Most viewed news API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch most viewed news",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

