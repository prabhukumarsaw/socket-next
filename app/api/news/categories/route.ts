/**
 * Public Categories API Endpoint
 * 
 * GET /api/news/categories
 * 
 * Returns all public categories with news counts
 * Useful for building category navigation
 * 
 * Response:
 * {
 *   success: boolean,
 *   data: Category[],
 *   meta: {
 *     count: number,
 *     timestamp: string
 *   }
 * }
 */

import { NextResponse } from "next/server";
import { getCachedPublicCategories } from "@/lib/services/news-api.service";

export const dynamic = "force-dynamic";
export const revalidate = 300; // Cache categories longer (5 minutes)

export async function GET() {
  try {
    const categories = await getCachedPublicCategories();

    return NextResponse.json(
      {
        success: true,
        data: categories,
        meta: {
          count: categories.length,
          timestamp: new Date().toISOString(),
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    console.error("Categories API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch categories",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

