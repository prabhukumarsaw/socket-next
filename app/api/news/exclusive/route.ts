/**
 * Exclusive News API
 * Returns featured/exclusive news articles
 * 
 * GET /api/news/exclusive?limit=4
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getCachedFeaturedNews } from "@/lib/services/news-api.service";
import { mapArrayToExclusiveNewsItems } from "@/lib/utils/category-section-mapper";

export const revalidate = 60; // Revalidate every 60 seconds

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const limitParam = searchParams.get("limit");
    const limit = limitParam
      ? Math.min(Math.max(parseInt(limitParam, 10), 1), 20)
      : 4;

    // Fetch featured news as exclusive news
    const news = await getCachedFeaturedNews({
      limit,
      includeAuthor: true,
      includeCategories: true,
      includeContent: false,
    });

    // Map to ExclusiveNewsItem format
    const exclusiveItems = mapArrayToExclusiveNewsItems(news);

    return NextResponse.json(
      {
        success: true,
        data: exclusiveItems,
        meta: {
          count: exclusiveItems.length,
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
    console.error("Exclusive news API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch exclusive news",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

