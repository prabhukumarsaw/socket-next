"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/jwt-server";
import { hasPermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/audit-log";
import { revalidatePath } from "next/cache";
import { z } from "zod";

/**
 * News/Post Management Server Actions
 * Handles CRUD operations for news posts with RBAC
 */

// Custom URL validation that accepts absolute URLs, relative URLs (starting with /), or empty strings
const urlOrEmpty = z.preprocess(
  (val) => (val === "" || val === null || val === undefined ? "" : val),
  z.union([
    z.literal(""), // Empty string first
    z.string().regex(/^\/.*/, "Relative URL must start with /"), // Relative URLs
    z.string().url("Please enter a valid URL"), // Absolute URLs
  ])
).optional();

const createNewsSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required").optional(),
  content: z.string().min(1, "Content is required"),
  excerpt: z.string().optional(),
  coverImage: urlOrEmpty,
  categoryIds: z.array(z.string()).min(1, "At least one category is required"),
  isPublished: z.boolean().default(false),
  isBreaking: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.string().optional(),
  ogImage: urlOrEmpty,
  scheduledAt: z.string().datetime().optional(),
});

const updateNewsSchema = z.object({
  id: z.string(),
  title: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  excerpt: z.string().optional(),
  coverImage: urlOrEmpty,
  categoryIds: z.array(z.string()).optional(),
  isPublished: z.boolean().optional(),
  isActive: z.boolean().optional(),
  isBreaking: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.string().optional(),
  ogImage: urlOrEmpty,
  scheduledAt: z.string().datetime().optional(),
});

/**
 * Generate slug from title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Create a new news post
 * Authors can only create their own posts
 * Editors and admins can create posts
 */
export async function createNews(data: z.infer<typeof createNewsSchema>) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    // Check if user has news.create permission
    const hasAccess = await hasPermission(currentUser.userId, "news.create");
    if (!hasAccess) {
      return {
        success: false,
        error: "You don't have permission to create news posts",
      };
    }

    const validated = createNewsSchema.parse(data);
    
    // Generate slug if not provided
    const slug = validated.slug || generateSlug(validated.title);

    // Check if slug already exists
    const existingSlug = await prisma.news.findUnique({
      where: { slug },
    });
    if (existingSlug) {
      return { success: false, error: "A news post with this slug already exists" };
    }

    // Verify categories exist and are public
    const categories = await prisma.menu.findMany({
      where: {
        id: { in: validated.categoryIds },
        isPublic: true,
        isActive: true,
      },
    });

    if (categories.length !== validated.categoryIds.length) {
      return { success: false, error: "One or more categories are invalid" };
    }

    // Create news post
    const news = await prisma.news.create({
      data: {
        title: validated.title,
        slug,
        content: validated.content,
        excerpt: validated.excerpt,
        coverImage: validated.coverImage || null,
        isPublished: validated.isPublished,
        isBreaking: validated.isBreaking,
        isFeatured: validated.isFeatured,
        metaTitle: validated.metaTitle,
        metaDescription: validated.metaDescription,
        metaKeywords: validated.metaKeywords,
        ogImage: validated.ogImage || null,
        authorId: currentUser.userId,
        publishedAt: validated.isPublished ? new Date() : null,
        scheduledAt: validated.scheduledAt ? new Date(validated.scheduledAt) : null,
        categories: {
          create: validated.categoryIds.map((menuId) => ({
            menuId,
          })),
        },
      },
      include: {
        categories: {
          include: {
            menu: true,
          },
        },
        author: {
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

    await createAuditLog({
      action: "CREATE_NEWS",
      resource: "News",
      resourceId: news.id,
      description: `User ${currentUser.email} created news: ${news.title}`,
    });

    revalidatePath("/dashboard/news");
    revalidatePath("/news");

    return { success: true, news };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    console.error("Create news error:", error);
    return { success: false, error: "Failed to create news post" };
  }
}

/**
 * Update a news post
 * Authors can only update their own posts
 * Editors and admins can update any post
 */
export async function updateNews(data: z.infer<typeof updateNewsSchema>) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const validated = updateNewsSchema.parse(data);

    // Get existing news
    const existingNews = await prisma.news.findUnique({
      where: { id: validated.id },
      include: {
        categories: true,
      },
    });

    if (!existingNews) {
      return { success: false, error: "News post not found" };
    }

    // Check if user is the author OR has news.update permission
    const isAuthor = existingNews.authorId === currentUser.userId;
    const hasUpdatePermission = await hasPermission(currentUser.userId, "news.update");

    if (!isAuthor && !hasUpdatePermission) {
      return {
        success: false,
        error: "You don't have permission to update this news post",
      };
    }

    // Check slug uniqueness if changing
    if (validated.slug && validated.slug !== existingNews.slug) {
      const slugExists = await prisma.news.findUnique({
        where: { slug: validated.slug },
      });
      if (slugExists) {
        return { success: false, error: "A news post with this slug already exists" };
      }
    }

    // Verify categories if updating
    if (validated.categoryIds && validated.categoryIds.length > 0) {
      const categories = await prisma.menu.findMany({
        where: {
          id: { in: validated.categoryIds },
          isPublic: true,
          isActive: true,
        },
      });

      if (categories.length !== validated.categoryIds.length) {
        return { success: false, error: "One or more categories are invalid" };
      }
    }

    const updateData: any = {};
    if (validated.title) updateData.title = validated.title;
    if (validated.slug) updateData.slug = validated.slug;
    if (validated.content) updateData.content = validated.content;
    if (validated.excerpt !== undefined) updateData.excerpt = validated.excerpt;
    if (validated.coverImage !== undefined) {
      updateData.coverImage = validated.coverImage || null;
    }
    if (validated.isPublished !== undefined) {
      updateData.isPublished = validated.isPublished;
      if (validated.isPublished && !existingNews.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }
    if (validated.isActive !== undefined) updateData.isActive = validated.isActive;
    if (validated.isBreaking !== undefined) updateData.isBreaking = validated.isBreaking;
    if (validated.isFeatured !== undefined) updateData.isFeatured = validated.isFeatured;
    if (validated.metaTitle !== undefined) updateData.metaTitle = validated.metaTitle;
    if (validated.metaDescription !== undefined) updateData.metaDescription = validated.metaDescription;
    if (validated.metaKeywords !== undefined) updateData.metaKeywords = validated.metaKeywords;
    if (validated.ogImage !== undefined) {
      updateData.ogImage = validated.ogImage || null;
    }
    if (validated.scheduledAt !== undefined) {
      updateData.scheduledAt = validated.scheduledAt ? new Date(validated.scheduledAt) : null;
    }

    // If user has update permission (editor/admin), mark as edited
    if (hasUpdatePermission && !isAuthor) {
      updateData.editorId = currentUser.userId;
    }

    const news = await prisma.news.update({
      where: { id: validated.id },
      data: updateData,
      include: {
        categories: {
          include: {
            menu: true,
          },
        },
        author: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        editor: {
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

    // Update categories if provided
    if (validated.categoryIds) {
      // Delete existing categories
      await prisma.newsCategory.deleteMany({
        where: { newsId: validated.id },
      });

      // Create new categories
      await prisma.newsCategory.createMany({
        data: validated.categoryIds.map((menuId) => ({
          newsId: validated.id,
          menuId,
        })),
        skipDuplicates: true,
      });
    }

    await createAuditLog({
      action: "UPDATE_NEWS",
      resource: "News",
      resourceId: news.id,
      description: `User ${currentUser.email} updated news: ${news.title}`,
    });

    revalidatePath("/dashboard/news");
    revalidatePath(`/news/${news.slug}`);
    revalidatePath("/news");

    return { success: true, news };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    console.error("Update news error:", error);
    return { success: false, error: "Failed to update news post" };
  }
}

/**
 * Delete a news post
 * Authors can only delete their own posts
 * Editors and admins can delete any post
 */
export async function deleteNews(newsId: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const news = await prisma.news.findUnique({
      where: { id: newsId },
    });

    if (!news) {
      return { success: false, error: "News post not found" };
    }

    // Check if user is the author OR has news.delete permission
    const isAuthor = news.authorId === currentUser.userId;
    const hasDeletePermission = await hasPermission(currentUser.userId, "news.delete");

    if (!isAuthor && !hasDeletePermission) {
      return {
        success: false,
        error: "You don't have permission to delete this news post",
      };
    }

    await prisma.news.delete({
      where: { id: newsId },
    });

    await createAuditLog({
      action: "DELETE_NEWS",
      resource: "News",
      resourceId: newsId,
      description: `User ${currentUser.email} deleted news: ${news.title}`,
    });

    revalidatePath("/dashboard/news");
    revalidatePath("/news");

    return { success: true };
  } catch (error) {
    console.error("Delete news error:", error);
    return { success: false, error: "Failed to delete news post" };
  }
}

/**
 * Get user's news posts
 * Authors see only their own posts
 * Editors and admins see all posts
 */
export async function getUserNews(
  page: number = 1,
  limit: number = 10,
  search?: string,
  filters?: {
    isPublished?: boolean;
    isActive?: boolean;
    categoryId?: string;
  }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const hasReadAllPermission = await hasPermission(currentUser.userId, "news.read.all");
    const skip = (page - 1) * limit;
    const where: any = {};

    // If user has read.all permission, they can see all news
    // Otherwise, only their own news
    if (!hasReadAllPermission) {
      where.authorId = currentUser.userId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
        { excerpt: { contains: search, mode: "insensitive" } },
      ];
    }

    if (filters?.isPublished !== undefined) {
      where.isPublished = filters.isPublished;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.categoryId) {
      where.categories = {
        some: {
          menuId: filters.categoryId,
        },
      };
    }

    const [news, total] = await Promise.all([
      prisma.news.findMany({
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
          editor: {
            select: {
              id: true,
              username: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          categories: {
            include: {
              menu: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.news.count({ where }),
    ]);

    return {
      success: true,
      news,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error("Get news error:", error);
    return { success: false, error: "Failed to fetch news posts" };
  }
}

/**
 * Get single news by ID
 * Authors can only view their own posts
 * Editors and admins can view any post
 */
export async function getNewsById(newsId: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const news = await prisma.news.findUnique({
      where: { id: newsId },
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
        editor: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        categories: {
          include: {
            menu: true,
          },
        },
      },
    });

    if (!news) {
      return { success: false, error: "News post not found" };
    }

    // Check if user is the author OR has news.read.all permission
    const isAuthor = news.authorId === currentUser.userId;
    const hasReadAllPermission = await hasPermission(currentUser.userId, "news.read.all");

    if (!isAuthor && !hasReadAllPermission) {
      return {
        success: false,
        error: "You don't have permission to view this news post",
      };
    }

    return {
      success: true,
      news,
    };
  } catch (error) {
    console.error("Get news error:", error);
    return { success: false, error: "Failed to fetch news post" };
  }
}

/**
 * Get news by slug (public API - no auth required)
 * Used for public news pages
 */
export async function getNewsBySlug(slug: string) {
  try {
    const news = await prisma.news.findUnique({
      where: { slug },
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
        editor: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        categories: {
          include: {
            menu: true,
          },
        },
        _count: {
          select: {
            comments: {
              where: {
                isApproved: true,
                isSpam: false,
              },
            },
          },
        },
      },
    });

    // Only return published and active news
    if (!news || !news.isPublished || !news.isActive) {
      return { success: false, error: "News post not found" };
    }

    // Add comment count to news object
    const newsWithCount = {
      ...news,
      commentCount: news._count?.comments || 0,
    };

    return {
      success: true,
      news: newsWithCount,
    };
  } catch (error) {
    console.error("Get news by slug error:", error);
    return { success: false, error: "Failed to fetch news post" };
  }
}

/**
 * Get related news articles (public API - no auth required)
 */
export async function getRelatedNews(currentSlug: string, categoryIds: string[] = [], limit: number = 3) {
  try {
    const related = await prisma.news.findMany({
      where: {
        slug: { not: currentSlug },
        isPublished: true,
        isActive: true,
        ...(categoryIds.length > 0 && {
          categories: {
            some: {
              menuId: { in: categoryIds },
            },
          },
        }),
      },
      take: limit,
      orderBy: {
        publishedAt: "desc",
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        categories: {
          include: {
            menu: true,
          },
        },
      },
    });

    return {
      success: true,
      news: related,
    };
  } catch (error) {
    console.error("Get related news error:", error);
    return { success: false, error: "Failed to fetch related news", news: [] };
  }
}

/**
 * Track news view (public API - no auth required)
 */
export async function trackNewsView(newsId: string, ipAddress: string, userAgent?: string) {
  try {
    // Check if news exists
    const news = await prisma.news.findUnique({
      where: { id: newsId },
    });

    if (!news) {
      return { success: false, error: "News post not found" };
    }

    // Create view record
    await prisma.newsView.create({
      data: {
        newsId,
        ipAddress,
        userAgent: userAgent || null,
      },
    });

    // Increment view count
    await prisma.news.update({
      where: { id: newsId },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Track news view error:", error);
    return { success: false, error: "Failed to track view" };
  }
}

