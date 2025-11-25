/**
 * Author-wise News API Endpoint
 * 
 * GET /api/news/author/[authorId]
 * 
 * Returns all published news articles by a specific author
 * 
 * Query Parameters:
 * - page: page number (default: 1)
 * - limit: number of results per page (default: 10, max: 50)
 * - includeContent: include full content (default: false)
 * 
 * Response:
 * {
 *   success: boolean,
 *   data: NewsResponse[],
 *   pagination: {
 *     page: number,
 *     limit: number,
 *     total: number,
 *     totalPages: number,
 *     hasNext: boolean,
 *     hasPrev: boolean
 *   },
 *   meta: {
 *     authorId: string,
 *     timestamp: string
 *   }
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { getNewsByAuthor } from "@/lib/services/news-api.service";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ authorId: string }> }
) {
  try {
    const { authorId } = await params;
    const searchParams = request.nextUrl.searchParams;

    // Verify author exists
    const author = await prisma.user.findUnique({
      where: { id: authorId },
      select: { id: true, username: true, firstName: true, lastName: true },
    });

    if (!author) {
      return NextResponse.json(
        {
          success: false,
          error: "Author not found",
        },
        { status: 404 }
      );
    }

    // Parse query parameters
    const pageParam = searchParams.get("page");
    const page = pageParam ? Math.max(parseInt(pageParam, 10), 1) : 1;

    const limitParam = searchParams.get("limit");
    const limit = limitParam
      ? Math.min(Math.max(parseInt(limitParam, 10), 1), 50)
      : 10;

    const includeContent = searchParams.get("includeContent") === "true";

    // Fetch author's news
    const result = await getNewsByAuthor(authorId, {
      page,
      limit,
      includeContent,
      includeAuthor: true,
      includeCategories: true,
    });

    return NextResponse.json(
      {
        success: true,
        data: result.data,
        pagination: result.pagination,
        meta: {
          author: {
            id: author.id,
            username: author.username,
            name: `${author.firstName || ""} ${author.lastName || ""}`.trim() || author.username,
          },
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
    console.error("Author news API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch author news",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

