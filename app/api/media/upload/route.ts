import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/jwt-server";
import { hasPermission } from "@/lib/auth/permissions";
import { uploadMedia } from "@/lib/actions/media";

/**
 * API Route for Media Upload
 * Handles direct file uploads with size validation
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const hasAccess = await hasPermission(user.userId, "media.upload");
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: "You don't have permission to upload media" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folder = formData.get("folder") as string | null;
    const tags = formData.get("tags") as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(0);
      return NextResponse.json(
        {
          success: false,
          error: `File size (${fileSizeMB}MB) exceeds maximum allowed size (${maxSizeMB}MB). Please compress the image before uploading.`,
        },
        { status: 400 }
      );
    }

    // Show info for large files (>1MB) - will be optimized
    const fileSizeMB = file.size / (1024 * 1024);
    let warning = null;
    if (fileSizeMB > 1) {
      warning = `Large file detected (${fileSizeMB.toFixed(2)}MB). File will be automatically optimized during upload.`;
    }

    const tagsArray = tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined;

    const result = await uploadMedia(
      file,
      folder || undefined,
      tagsArray
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        media: result.media,
        warning,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Media upload API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to upload media",
      },
      { status: 500 }
    );
  }
}

