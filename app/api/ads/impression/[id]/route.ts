/**
 * Track Ad Impression API
 * Non-blocking endpoint to track advertisement impressions
 */

import { NextRequest, NextResponse } from "next/server";
import { trackAdImpression } from "@/lib/services/ads.service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Track impression asynchronously (non-blocking)
    trackAdImpression(id).catch(() => {
      // Silently fail - don't log to avoid spam
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    // Always return success to not break the page
    return NextResponse.json({ success: true }, { status: 200 });
  }
}

