"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/jwt-server";
import { hasPermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/audit-log";
import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary";
import { revalidatePath } from "next/cache";
import { z } from "zod";

/**
 * Media Management Server Actions
 * Handles media upload, management, and deletion with Cloudinary
 */

const uploadMediaSchema = z.object({
  name: z.string().min(1, "Name is required"),
  url: z.string().url("Invalid URL"),
  publicId: z.string().min(1, "Public ID is required"),
  format: z.string().min(1, "Format is required"),
  resourceType: z.enum(["image", "video", "raw"]),
  bytes: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  duration: z.number().optional(),
  folder: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * Upload media file to Cloudinary and save to database
 */
export async function uploadMedia(file: File, folder?: string, tags?: string[]) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    // Check if user has media.upload permission
    const hasAccess = await hasPermission(currentUser.userId, "media.upload");
    if (!hasAccess) {
      return {
        success: false,
        error: "You don't have permission to upload media",
      };
    }

    // Check file size and validate
    const fileSizeMB = file.size / (1024 * 1024);
    const maxSizeMB = 10; // 10MB max before upload
    
    if (fileSizeMB > maxSizeMB) {
      return {
        success: false,
        error: `File size (${fileSizeMB.toFixed(2)}MB) exceeds maximum allowed size (${maxSizeMB}MB). Please compress the image before uploading.`,
      };
    }

    // Show info if file is large (will be optimized)
    if (fileSizeMB > 1) {
      // File will be automatically optimized by Cloudinary
      console.info(`Large file detected: ${fileSizeMB.toFixed(2)}MB. Will be optimized during upload.`);
    }

    // Upload to Cloudinary with optimization
    const uploadResult = await uploadToCloudinary(file, {
      folder: folder || "bawal-news/media",
      tags: tags || [],
      optimize: true,
      compression: "auto",
      maxFileSize: 10 * 1024 * 1024, // 10MB max
    });

    // Save to database
    const media = await prisma.media.create({
      data: {
        name: file.name,
        url: uploadResult.secureUrl,
        publicId: uploadResult.publicId,
        format: uploadResult.format,
        resourceType: uploadResult.resourceType as "image" | "video" | "raw",
        bytes: uploadResult.bytes,
        width: uploadResult.width,
        height: uploadResult.height,
        duration: uploadResult.duration,
        folder: folder || "bawal-news/media",
        tags: tags || [],
        uploadedBy: currentUser.userId,
      },
    });

    await createAuditLog({
      action: "UPLOAD_MEDIA",
      resource: "Media",
      resourceId: media.id,
      description: `User ${currentUser.email} uploaded media: ${media.name}`,
    });

    revalidatePath("/dashboard/media");

    return { success: true, media };
  } catch (error) {
    console.error("Upload media error:", error);
    return { success: false, error: "Failed to upload media" };
  }
}

/**
 * Save media record (for external uploads)
 */
export async function saveMedia(data: z.infer<typeof uploadMediaSchema>) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const hasAccess = await hasPermission(currentUser.userId, "media.upload");
    if (!hasAccess) {
      return {
        success: false,
        error: "You don't have permission to upload media",
      };
    }

    const validated = uploadMediaSchema.parse(data);

    const media = await prisma.media.create({
      data: {
        ...validated,
        uploadedBy: currentUser.userId,
      },
    });

    await createAuditLog({
      action: "SAVE_MEDIA",
      resource: "Media",
      resourceId: media.id,
      description: `User ${currentUser.email} saved media: ${media.name}`,
    });

    revalidatePath("/dashboard/media");

    return { success: true, media };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    console.error("Save media error:", error);
    return { success: false, error: "Failed to save media" };
  }
}

/**
 * Delete media file
 */
export async function deleteMedia(mediaId: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const media = await prisma.media.findUnique({
      where: { id: mediaId },
    });

    if (!media) {
      return { success: false, error: "Media not found" };
    }

    // Check if user is the uploader OR has media.delete permission
    const isUploader = media.uploadedBy === currentUser.userId;
    const hasDeletePermission = await hasPermission(currentUser.userId, "media.delete");

    if (!isUploader && !hasDeletePermission) {
      return {
        success: false,
        error: "You don't have permission to delete this media",
      };
    }

    // Delete from Cloudinary
    try {
      await deleteFromCloudinary(media.publicId);
    } catch (error) {
      console.error("Failed to delete from Cloudinary:", error);
      // Continue with database deletion even if Cloudinary deletion fails
    }

    // Delete from database
    await prisma.media.delete({
      where: { id: mediaId },
    });

    await createAuditLog({
      action: "DELETE_MEDIA",
      resource: "Media",
      resourceId: mediaId,
      description: `User ${currentUser.email} deleted media: ${media.name}`,
    });

    revalidatePath("/dashboard/media");

    return { success: true };
  } catch (error) {
    console.error("Delete media error:", error);
    return { success: false, error: "Failed to delete media" };
  }
}

/**
 * Get user's media files
 * Users see only their own media
 * Admins see all media
 */
export async function getUserMedia(
  page: number = 1,
  limit: number = 20,
  search?: string,
  filters?: {
    resourceType?: "image" | "video" | "raw";
    folder?: string;
  }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const hasReadAllPermission = await hasPermission(currentUser.userId, "media.read.all");
    const skip = (page - 1) * limit;
    const where: any = {};

    // If user has read.all permission, they can see all media
    // Otherwise, only their own media
    if (!hasReadAllPermission) {
      where.uploadedBy = currentUser.userId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { folder: { contains: search, mode: "insensitive" } },
      ];
    }

    if (filters?.resourceType) {
      where.resourceType = filters.resourceType;
    }

    if (filters?.folder) {
      where.folder = filters.folder;
    }

    const [media, total] = await Promise.all([
      prisma.media.findMany({
        where,
        include: {
          uploader: {
            select: {
              id: true,
              username: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.media.count({ where }),
    ]);

    return {
      success: true,
      media,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error("Get media error:", error);
    return { success: false, error: "Failed to fetch media" };
  }
}

/**
 * Get media by ID
 */
export async function getMediaById(mediaId: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const media = await prisma.media.findUnique({
      where: { id: mediaId },
      include: {
        uploader: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!media) {
      return { success: false, error: "Media not found" };
    }

    // Check if user is the uploader OR has media.read.all permission
    const isUploader = media.uploadedBy === currentUser.userId;
    const hasReadAllPermission = await hasPermission(currentUser.userId, "media.read.all");

    if (!isUploader && !hasReadAllPermission) {
      return {
        success: false,
        error: "You don't have permission to view this media",
      };
    }

    return {
      success: true,
      media,
    };
  } catch (error) {
    console.error("Get media error:", error);
    return { success: false, error: "Failed to fetch media" };
  }
}

