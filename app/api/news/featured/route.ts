/**
 * Featured News API Endpoint
 * 
 * GET /api/news/featured
 * 
 * Returns featured news articles sorted by published date
 * 
 * Query Parameters:
 * - limit: number of results (default: 10, max: 50)
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
import { getCachedFeaturedNews } from "@/lib/services/news-api.service";

export const dynamic = "force-dynamic"; // Allow dynamic rendering
export const revalidate = 60; // Revalidate every 60 seconds

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parse query parameters
    const limitParam = searchParams.get("limit");
    const limit = limitParam
      ? Math.min(Math.max(parseInt(limitParam, 10), 1), 50) // Clamp between 1 and 50
      : 10;

    const includeContent = searchParams.get("includeContent") === "true";

    // Fetch featured news
    const news = await getCachedFeaturedNews({
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
    console.error("Featured news API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch featured news",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

