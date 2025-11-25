/**
 * Advanced News Search API Endpoint
 * 
 * GET /api/news/search
 * 
 * Provides advanced search functionality with:
 * - Full-text search
 * - Category filtering
 * - Author filtering
 * - Date range filtering
 * - Sorting options
 * - Pagination
 * 
 * Query Parameters:
 * - q: Search query (required)
 * - category: Category slug filter
 * - authorId: Author ID filter
 * - dateFrom: Start date (ISO string)
 * - dateTo: End date (ISO string)
 * - sortBy: Sort option (relevance|date|views|likes, default: relevance)
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 10, max: 50)
 * - includeContent: Include full content (default: false)
 * 
 * Response:
 * {
 *   success: boolean,
 *   data: SearchResponse,
 *   meta: {
 *     timestamp: string
 *   }
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { searchNews, quickSearch } from "@/lib/services/news-search.service";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const query = searchParams.get("q")?.trim();
    
    if (!query || query.length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: "Search query must be at least 2 characters",
        },
        { status: 400 }
      );
    }

    // Quick search mode (for autocomplete)
    const quick = searchParams.get("quick") === "true";
    if (quick) {
      const limitParam = searchParams.get("limit");
      const limit = limitParam
        ? Math.min(Math.max(parseInt(limitParam, 10), 1), 10)
        : 5;

      const results = await quickSearch(query, limit);

      return NextResponse.json(
        {
          success: true,
          data: results,
          meta: {
            mode: "quick",
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
    }

    // Full search
    const category = searchParams.get("category") || undefined;
    const authorId = searchParams.get("authorId") || undefined;
    
    const dateFromParam = searchParams.get("dateFrom");
    const dateFrom = dateFromParam ? new Date(dateFromParam) : undefined;
    
    const dateToParam = searchParams.get("dateTo");
    const dateTo = dateToParam ? new Date(dateToParam) : undefined;

    const sortByParam = searchParams.get("sortBy");
    const sortBy = (["relevance", "date", "views", "likes"].includes(sortByParam || "")
      ? sortByParam
      : "relevance") as "relevance" | "date" | "views" | "likes";

    const pageParam = searchParams.get("page");
    const page = pageParam ? Math.max(parseInt(pageParam, 10), 1) : 1;

    const limitParam = searchParams.get("limit");
    const limit = limitParam
      ? Math.min(Math.max(parseInt(limitParam, 10), 1), 50)
      : 10;

    const includeContent = searchParams.get("includeContent") === "true";

    const result = await searchNews({
      query,
      category,
      authorId,
      dateFrom,
      dateTo,
      sortBy,
      page,
      limit,
      includeContent,
    });

    return NextResponse.json(
      {
        success: true,
        data: result,
        meta: {
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
    console.error("News search API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to perform search",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
