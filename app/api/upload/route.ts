export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/jwt-server";
import { hasPermission } from "@/lib/auth/permissions";
import { uploadToLocalStorage, type UploadOptions } from "@/lib/storage/local-storage";

/**
 * Local Media Upload API Route
 * Handles secure file uploads with validation and compression
 */

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Permission check
    const hasAccess = await hasPermission(user.userId, "media.upload");
    if (!hasAccess) {
      return NextResponse.json(
        { error: "You don't have permission to upload media" },
        { status: 403 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = formData.get("folder") as string | null;
    const tags = formData.get("tags") as string | null;
    const quality = formData.get("quality") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Prepare upload options
    const options: UploadOptions = {
      folder: folder || undefined,
      tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
      quality: quality ? parseInt(quality) : 80,
      generateBlur: true,
    };

    // Upload file
    const result = await uploadToLocalStorage(file, file.name, options);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload file" },
      { status: 400 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};


