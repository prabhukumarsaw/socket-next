/**
 * Category-wise News API Endpoint
 * 
 * GET /api/news/category/[slug]
 * 
 * Returns news articles filtered by category
 * 
 * Handles complex category logic:
 * - Single category: /api/news/category/sport
 * - Parent category (includes children): ?includeChildren=true
 * - State-wise categories: Automatically detected
 * - Nested categories: Supports parent-child relationships
 * 
 * Query Parameters:
 * - page: page number (default: 1)
 * - limit: number of results per page (default: 10, max: 50)
 * - includeChildren: include child categories (default: false)
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
 *     category: {
 *       id: string,
 *       name: string,
 *       slug: string,
 *       parentId: string | null
 *     },
 *     includeChildren: boolean,
 *     timestamp: string
 *   }
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { getNewsByCategory, getCachedPublicCategories } from "@/lib/services/news-api.service";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const searchParams = request.nextUrl.searchParams;

    // Verify category exists and is public
    const category = await prisma.menu.findUnique({
      where: { slug, isPublic: true, isActive: true },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        children: {
          where: { isPublic: true, isActive: true },
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            news: {
              where: {
                news: {
                  isPublished: true,
                  isActive: true,
                },
              },
            },
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          error: "Category not found or not public",
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

    const includeChildren = searchParams.get("includeChildren") === "true";
    const includeContent = searchParams.get("includeContent") === "true";

    // Build category filter
    const categoryFilter = {
      slug,
      includeChildren,
      // You can add stateWise detection logic here if needed
      // stateWise: category.slug.match(/^(delhi|kolkata|bangalore|mumbai)$/i) !== null,
    };

    // Fetch category news
    const result = await getNewsByCategory(categoryFilter, {
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
          category: {
            id: category.id,
            name: category.name,
            slug: category.slug,
            parentId: category.parentId,
            parent: category.parent,
            children: category.children,
            newsCount: category._count.news,
          },
          includeChildren,
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
    console.error("Category news API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch category news",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

