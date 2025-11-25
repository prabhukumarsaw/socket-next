/**
 * Breaking News API Endpoint
 * 
 * GET /api/news/breaking
 * 
 * Returns breaking news articles sorted by published date
 * 
 * Query Parameters:
 * - limit: number of results (default: 5, max: 20)
 * - includeContent: include full content (default: false)
 * 
 * Response:
 * {
 *   success: boolean,
 *   data: NewsResponse[],
 *   meta: {
 *     count: number,
 *     timestamp: string
 *   }
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { getCachedBreakingNews } from "@/lib/services/news-api.service";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const limitParam = searchParams.get("limit");
    const limit = limitParam
      ? Math.min(Math.max(parseInt(limitParam, 10), 1), 20)
      : 5;

    const includeContent = searchParams.get("includeContent") === "true";

    const news = await getCachedBreakingNews({
      limit,
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
    console.error("Breaking news API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch breaking news",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

