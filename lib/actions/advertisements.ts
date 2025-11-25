"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/jwt-server";
import { hasPermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/audit-log";
import { revalidatePath } from "next/cache";
import { z } from "zod";

/**
 * Advertisement/Sponsor Management Server Actions
 * Handles CRUD operations for advertisements
 */

// Custom URL validation that accepts absolute URLs, relative URLs (starting with /), or empty strings
const urlOrEmpty = z.preprocess(
  (val) => (val === "" || val === null || val === undefined ? "" : val),
  z.union([
    z.literal(""), // Empty string first
    z.string().regex(/^\/.*/, "Relative URL must start with /"), // Relative URLs
    z.string().url("Please enter a valid URL"), // Absolute URLs
  ])
);

const createAdvertisementSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  imageUrl: urlOrEmpty,
  linkUrl: z.string().url().optional().or(z.literal("")),
  zone: z.string().min(1, "Zone is required"), // header, sidebar, footer, inline
  position: z.number().int().default(0),
  startDate: z.string().datetime(), // Accept ISO format from transformed datetime-local
  endDate: z.string().datetime(), // Accept ISO format from transformed datetime-local
  newsId: z.string().optional(),
});

const updateAdvertisementSchema = z.object({
  id: z.string(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  imageUrl: urlOrEmpty.optional(),
  linkUrl: z.string().url().optional().or(z.literal("")),
  zone: z.string().min(1).optional(),
  position: z.number().int().optional(),
  isActive: z.boolean().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  newsId: z.string().optional(),
});

/**
 * Create a new advertisement
 */
export async function createAdvertisement(data: z.infer<typeof createAdvertisementSchema>) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    // Check if user has advertisement.create permission
    const hasAccess = await hasPermission(currentUser.userId, "advertisement.create");
    if (!hasAccess) {
      return {
        success: false,
        error: "You don't have permission to create advertisements",
      };
    }

    const validated = createAdvertisementSchema.parse(data);

    // Verify news exists if provided
    if (validated.newsId) {
      const news = await prisma.news.findUnique({
        where: { id: validated.newsId },
      });
      if (!news) {
        return { success: false, error: "News post not found" };
      }
    }

    // Validate date range
    const startDate = new Date(validated.startDate);
    const endDate = new Date(validated.endDate);
    if (endDate <= startDate) {
      return { success: false, error: "End date must be after start date" };
    }

    const advertisement = await prisma.advertisement.create({
      data: {
        title: validated.title,
        description: validated.description,
        imageUrl: validated.imageUrl,
        linkUrl: validated.linkUrl || null,
        zone: validated.zone,
        position: validated.position,
        startDate,
        endDate,
        authorId: currentUser.userId,
        newsId: validated.newsId || null,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        news: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    await createAuditLog({
      action: "CREATE_ADVERTISEMENT",
      resource: "Advertisement",
      resourceId: advertisement.id,
      description: `User ${currentUser.email} created advertisement: ${advertisement.title}`,
    });

    revalidatePath("/dashboard/advertisements");

    return { success: true, advertisement };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    console.error("Create advertisement error:", error);
    return { success: false, error: "Failed to create advertisement" };
  }
}

/**
 * Update an advertisement
 */
export async function updateAdvertisement(data: z.infer<typeof updateAdvertisementSchema>) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const validated = updateAdvertisementSchema.parse(data);

    // Get existing advertisement
    const existingAd = await prisma.advertisement.findUnique({
      where: { id: validated.id },
    });

    if (!existingAd) {
      return { success: false, error: "Advertisement not found" };
    }

    // Check if user is the author OR has advertisement.update permission
    const isAuthor = existingAd.authorId === currentUser.userId;
    const hasUpdatePermission = await hasPermission(currentUser.userId, "advertisement.update");

    if (!isAuthor && !hasUpdatePermission) {
      return {
        success: false,
        error: "You don't have permission to update this advertisement",
      };
    }

    // Verify news exists if provided
    if (validated.newsId) {
      const news = await prisma.news.findUnique({
        where: { id: validated.newsId },
      });
      if (!news) {
        return { success: false, error: "News post not found" };
      }
    }

    // Validate date range if both dates are provided
    if (validated.startDate && validated.endDate) {
      const startDate = new Date(validated.startDate);
      const endDate = new Date(validated.endDate);
      if (endDate <= startDate) {
        return { success: false, error: "End date must be after start date" };
      }
    }

    const updateData: any = {};
    if (validated.title) updateData.title = validated.title;
    if (validated.description !== undefined) updateData.description = validated.description;
    if (validated.imageUrl !== undefined) {
      updateData.imageUrl = validated.imageUrl || null;
    }
    if (validated.linkUrl !== undefined) {
      updateData.linkUrl = validated.linkUrl || null;
    }
    if (validated.zone) updateData.zone = validated.zone;
    if (validated.position !== undefined) updateData.position = validated.position;
    if (validated.isActive !== undefined) updateData.isActive = validated.isActive;
    if (validated.startDate) updateData.startDate = new Date(validated.startDate);
    if (validated.endDate) updateData.endDate = new Date(validated.endDate);
    if (validated.newsId !== undefined) {
      updateData.newsId = validated.newsId || null;
    }

    const advertisement = await prisma.advertisement.update({
      where: { id: validated.id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        news: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    await createAuditLog({
      action: "UPDATE_ADVERTISEMENT",
      resource: "Advertisement",
      resourceId: advertisement.id,
      description: `User ${currentUser.email} updated advertisement: ${advertisement.title}`,
    });

    revalidatePath("/dashboard/advertisements");

    return { success: true, advertisement };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    console.error("Update advertisement error:", error);
    return { success: false, error: "Failed to update advertisement" };
  }
}

/**
 * Delete an advertisement
 */
export async function deleteAdvertisement(adId: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const ad = await prisma.advertisement.findUnique({
      where: { id: adId },
    });

    if (!ad) {
      return { success: false, error: "Advertisement not found" };
    }

    // Check if user is the author OR has advertisement.delete permission
    const isAuthor = ad.authorId === currentUser.userId;
    const hasDeletePermission = await hasPermission(currentUser.userId, "advertisement.delete");

    if (!isAuthor && !hasDeletePermission) {
      return {
        success: false,
        error: "You don't have permission to delete this advertisement",
      };
    }

    await prisma.advertisement.delete({
      where: { id: adId },
    });

    await createAuditLog({
      action: "DELETE_ADVERTISEMENT",
      resource: "Advertisement",
      resourceId: adId,
      description: `User ${currentUser.email} deleted advertisement: ${ad.title}`,
    });

    revalidatePath("/dashboard/advertisements");

    return { success: true };
  } catch (error) {
    console.error("Delete advertisement error:", error);
    return { success: false, error: "Failed to delete advertisement" };
  }
}

/**
 * Get user's advertisements
 */
export async function getUserAdvertisements(
  page: number = 1,
  limit: number = 10,
  search?: string,
  filters?: {
    zone?: string;
    isActive?: boolean;
  }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const hasReadAllPermission = await hasPermission(currentUser.userId, "advertisement.read.all");
    const skip = (page - 1) * limit;
    const where: any = {};

    // If user has read.all permission, they can see all ads
    // Otherwise, only their own ads
    if (!hasReadAllPermission) {
      where.authorId = currentUser.userId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (filters?.zone) {
      where.zone = filters.zone;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const [advertisements, total] = await Promise.all([
      prisma.advertisement.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          news: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.advertisement.count({ where }),
    ]);

    return {
      success: true,
      advertisements,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error("Get advertisements error:", error);
    return { success: false, error: "Failed to fetch advertisements" };
  }
}

/**
 * Get single advertisement by ID
 */
export async function getAdvertisementById(adId: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const advertisement = await prisma.advertisement.findUnique({
      where: { id: adId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        news: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    if (!advertisement) {
      return { success: false, error: "Advertisement not found" };
    }

    // Check if user is the author OR has advertisement.read.all permission
    const isAuthor = advertisement.authorId === currentUser.userId;
    const hasReadAllPermission = await hasPermission(currentUser.userId, "advertisement.read.all");

    if (!isAuthor && !hasReadAllPermission) {
      return {
        success: false,
        error: "You don't have permission to view this advertisement",
      };
    }

    return {
      success: true,
      advertisement,
    };
  } catch (error) {
    console.error("Get advertisement error:", error);
    return { success: false, error: "Failed to fetch advertisement" };
  }
}

/**
 * Track advertisement click
 */
export async function trackAdvertisementClick(adId: string) {
  try {
    await prisma.advertisement.update({
      where: { id: adId },
      data: {
        clicks: {
          increment: 1,
        },
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Track advertisement click error:", error);
    return { success: false, error: "Failed to track click" };
  }
}

/**
 * Track advertisement impression
 */
export async function trackAdvertisementImpression(adId: string) {
  try {
    await prisma.advertisement.update({
      where: { id: adId },
      data: {
        impressions: {
          increment: 1,
        },
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Track advertisement impression error:", error);
    return { success: false, error: "Failed to track impression" };
  }
}

