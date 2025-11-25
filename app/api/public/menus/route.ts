import { NextResponse } from "next/server";
import { getCachedPublicMenusTree } from "@/services/menu.service";

/**
 * Public Menus API Endpoint
 * 
 * GET /api/public/menus
 * 
 * Returns public menus (categories) with caching for fast loading
 * Cache duration: 5 minutes
 */
export const dynamic = "force-dynamic";
export const revalidate = 300; // 5 minutes

export async function GET() {
  try {
    const data = await getCachedPublicMenusTree();

    return NextResponse.json(
      {
        success: true,
        data,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    console.error("Public menus API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch menus" },
      { status: 500 }
    );
  }
}
