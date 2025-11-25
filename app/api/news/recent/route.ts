/**
 * Today's Recent News API Endpoint
 * 
 * GET /api/news/recent
 * 
 * Returns news articles published today, sorted by published date
 * 
 * Query Parameters:
 * - limit: number of results (default: 20, max: 100)
 * - includeContent: include full content (default: false)
 * 
 * Response:
 * {
 *   success: boolean,
 *   data: NewsResponse[],
 *   meta: {
 *     count: number,
 *     date: string,
 *     timestamp: string
 *   }
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { getCachedTodayRecentNews } from "@/lib/services/news-api.service";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const limitParam = searchParams.get("limit");
    const limit = limitParam
      ? Math.min(Math.max(parseInt(limitParam, 10), 1), 100)
      : 20;

    const includeContent = searchParams.get("includeContent") === "true";

    const news = await getCachedTodayRecentNews({
      limit,
      includeContent,
      includeAuthor: true,
      includeCategories: true,
    });

    const today = new Date().toISOString().split("T")[0];

    return NextResponse.json(
      {
        success: true,
        data: news,
        meta: {
          count: news.length,
          date: today,
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
    console.error("Recent news API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch recent news",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

