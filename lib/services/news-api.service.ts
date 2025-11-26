/**
 * News API Service Layer
 * 
 * This service provides optimized, cached, and performant data access
 * for public news APIs. Handles complex category logic including:
 * - State-wise news (Delhi, Kolkata, Bangalore, etc.)
 * - Parent categories (Sport, Business, Technology, etc.)
 * - Child categories (nested menu structure)
 * - Dynamic category filtering
 * 
 * Features:
 * - Response caching for fast loading
 * - Optimized database queries
 * - Pagination support
 * - Filtering and sorting
 * - SEO-friendly data structure
 */

import { prisma } from "@/lib/prisma";
import { cache } from "react";
import { unstable_cache } from "next/cache";

/**
 * Cache configuration
 * - Revalidate every 60 seconds for dynamic content
 * - Tag-based cache invalidation
 */
const CACHE_TAGS = {
  NEWS: "news",
  FEATURED: "news-featured",
  BREAKING: "news-breaking",
  MOST_VIEWED: "news-most-viewed",
  RECENT: "news-recent",
  CATEGORY: "news-category",
  AUTHOR: "news-author",
} as const;

const CACHE_REVALIDATE = 60; // 60 seconds

/**
 * Base query options for news fetching
 */
interface NewsQueryOptions {
  page?: number;
  limit?: number;
  includeContent?: boolean; // Include full content (for detail pages)
  includeAuthor?: boolean;
  includeCategories?: boolean;
}

/**
 * Category filter options
 * Supports complex filtering:
 * - Single category slug
 * - Parent category (includes all children)
 * - State-wise filtering
 * - Multiple categories
 */
interface CategoryFilter {
  slug?: string; // Category slug
  parentSlug?: string; // Parent category slug (includes children)
  includeChildren?: boolean; // Include child categories
  stateWise?: boolean; // Filter by state-wise categories
}

/**
 * News response structure
 */
export interface NewsResponse {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content?: string; // Only included if includeContent is true
  coverImage: string | null;
  isBreaking: boolean;
  isFeatured: boolean;
  viewCount: number;
  likes: number;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  author?: {
    id: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  categories?: Array<{
    id: string;
    menu: {
      id: string;
      name: string;
      slug: string;
      parentId: string | null;
      parent?: {
        id: string;
        name: string;
        slug: string;
      } | null;
    };
  }>;
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Get category IDs including children (for parent category filtering)
 * This handles the complex category logic:
 * - If parentSlug is provided, gets all child categories
 * - If slug is provided, gets that category and optionally its children
 * - Handles state-wise categories
 */
async function getCategoryIds(filter: CategoryFilter): Promise<string[]> {
  const categoryIds: string[] = [];

  if (filter.parentSlug) {
    // Get parent category
    const parent = await prisma.menu.findUnique({
      where: { slug: filter.parentSlug, isPublic: true, isActive: true },
      include: { children: { where: { isPublic: true, isActive: true } } },
    });

    if (parent) {
      categoryIds.push(parent.id);
      // Include all children
      if (parent.children) {
        categoryIds.push(...parent.children.map((child: any) => child.id));
      }
    }
  } else if (filter.slug) {
    // Get specific category
    const category = await prisma.menu.findUnique({
      where: { slug: filter.slug, isPublic: true, isActive: true },
      include: {
        children: filter.includeChildren
          ? { where: { isPublic: true, isActive: true } }
          : false,
      },
    });

    if (category) {
      categoryIds.push(category.id);
      // Include children if requested
      if (filter.includeChildren && category.children) {
        categoryIds.push(...category.children.map((child: any) => child.id));
      }
    }
  }

  return categoryIds;
}

/**
 * Build where clause for category filtering
 * Handles complex scenarios:
 * - State-wise news (e.g., Delhi, Kolkata)
 * - Parent categories with children (e.g., Sport includes all sport subcategories)
 * - Multiple category filtering
 */
async function buildCategoryWhere(filter?: CategoryFilter) {
  if (!filter) return {};

  const categoryIds = await getCategoryIds(filter);

  if (categoryIds.length === 0) {
    return { id: "no-match" }; // Return no results if no categories found
  }

  return {
    categories: {
      some: {
        menuId: { in: categoryIds },
      },
    },
  };
}

/**
 * Base news query builder
 * Optimized query with selective field inclusion
 */
function buildNewsQuery(options: NewsQueryOptions = {}) {
  const {
    includeContent = false,
    includeAuthor = true,
    includeCategories = true,
  } = options;

  const baseWhere: any = {
    isPublished: true,
    isActive: true,
    // Only show published news (not scheduled for future)
    OR: [
      { publishedAt: { lte: new Date() } },
      { publishedAt: null, createdAt: { lte: new Date() } },
    ],
  };

  return {
    where: baseWhere,
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      content: includeContent ? true : false,
      coverImage: true,
      isBreaking: true,
      isFeatured: true,
      viewCount: true,
      likes: true,
      publishedAt: true,
      createdAt: true,
      updatedAt: true,
      author: includeAuthor
        ? {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          }
        : false,
      categories: includeCategories
        ? {
            select: {
              id: true,
              menu: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  parentId: true,
                  parent: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                    },
                  },
                },
              },
            },
          }
        : false,
    },
  };
}

/**
 * Get featured news
 * Returns news marked as featured, sorted by published date
 */
export async function getFeaturedNews(
  options: NewsQueryOptions & { limit?: number } = {}
): Promise<NewsResponse[]> {
  const limit = options.limit || 10;

  const query = buildNewsQuery(options);
  query.where = {
    ...query.where,
    isFeatured: true,
  };

  const news = await prisma.news.findMany({
    ...query,
    take: limit,
    orderBy: [
      { publishedAt: "desc" },
      { createdAt: "desc" },
    ],
  });

  return news as unknown as NewsResponse[];
}

/**
 * Get breaking news
 * Returns news marked as breaking, sorted by published date
 */
export async function getBreakingNews(
  options: NewsQueryOptions & { limit?: number } = {}
): Promise<NewsResponse[]> {
  const limit = options.limit || 5;

  const query = buildNewsQuery(options);
  query.where = {
    ...query.where,
    isBreaking: true,
  };

  const news = await prisma.news.findMany({
    ...query,
    take: limit,
    orderBy: [
      { publishedAt: "desc" },
      { createdAt: "desc" },
    ],
  });

  return news as unknown as NewsResponse[];
}

/**
 * Get most viewed news
 * Returns news sorted by view count
 */
export async function getMostViewedNews(
  options: NewsQueryOptions & { limit?: number; days?: number } = {}
): Promise<NewsResponse[]> {
  const limit = options.limit || 10;
  const days = options.days || 30; // Default: last 30 days

  const query = buildNewsQuery(options);
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - days);

  query.where = {
    ...query.where,
    publishedAt: {
      gte: dateThreshold,
    },
  };

  const news = await prisma.news.findMany({
    ...query,
    take: limit,
    orderBy: [
      { viewCount: "desc" },
      { publishedAt: "desc" },
    ],
  });

  return news as unknown as NewsResponse[];
}

/**
 * Get recent news (today)
 * Returns news published today, sorted by published date
 */
export async function getTodayRecentNews(
  options: NewsQueryOptions & { limit?: number } = {}
): Promise<NewsResponse[]> {
  const limit = options.limit || 20;

  const query = buildNewsQuery(options);

  // Get start of today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  query.where = {
    ...query.where,
    publishedAt: {
      gte: today,
    },
  };

  const news = await prisma.news.findMany({
    ...query,
    take: limit,
    orderBy: [
      { publishedAt: "desc" },
      { createdAt: "desc" },
    ],
  });

  return news as unknown as NewsResponse[];
}

/**
 * Get news by author
 * Returns all published news by a specific author
 */
export async function getNewsByAuthor(
  authorId: string,
  options: NewsQueryOptions & { limit?: number; page?: number } = {}
): Promise<PaginatedResponse<NewsResponse>> {
  const page = options.page || 1;
  const limit = options.limit || 10;
  const skip = (page - 1) * limit;

  const query = buildNewsQuery(options);
  query.where = {
    ...query.where,
    authorId: authorId,
  };

  // Get total count for pagination
  const total = await prisma.news.count({ where: query.where });

  // Get paginated news
  const news = await prisma.news.findMany({
    ...query,
    skip,
    take: limit,
    orderBy: [
      { publishedAt: "desc" },
      { createdAt: "desc" },
    ],
  });

  return {
    data: news as unknown as NewsResponse[],
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  };
}

/**
 * Get news by category
 * Handles complex category logic:
 * - Single category
 * - Parent category (includes children)
 * - State-wise categories
 * - Multiple categories
 */
export async function getNewsByCategory(
  filter: CategoryFilter,
  options: NewsQueryOptions & { limit?: number; page?: number } = {}
): Promise<PaginatedResponse<NewsResponse>> {
  const page = options.page || 1;
  const limit = options.limit || 10;
  const skip = (page - 1) * limit;

  const query = buildNewsQuery(options);

  // Add category filter
  const categoryWhere = await buildCategoryWhere(filter);
  if (categoryWhere.id === "no-match") {
    // No matching categories
    return {
      data: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    };
  }

  query.where = {
    ...query.where,
    ...categoryWhere,
  };

  // Get total count for pagination
  const total = await prisma.news.count({ where: query.where });

  // Get paginated news
  const news = await prisma.news.findMany({
    ...query,
    skip,
    take: limit,
    orderBy: [
      { publishedAt: "desc" },
      { createdAt: "desc" },
    ],
  });

  return {
    data: news as unknown as NewsResponse[],
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  };
}

/**
 * Get all public categories with news counts
 * Useful for category navigation
 */
export async function getPublicCategories() {
  const categories = await prisma.menu.findMany({
    where: {
      isPublic: true,
      isActive: true,
    },
    include: {
      children: {
        where: {
          isPublic: true,
          isActive: true,
        },
        include: {
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
    orderBy: {
      order: "asc",
    },
  });

  return categories.map((category: any) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    path: category.path,
    icon: category.icon,
    parentId: category.parentId,
    order: category.order,
    newsCount: category._count.news,
    children: category.children.map((child: any) => ({
      id: child.id,
      name: child.name,
      slug: child.slug,
      path: child.path,
      icon: child.icon,
      parentId: child.parentId,
      order: child.order,
      newsCount: child._count.news,
    })),
  }));
}

/**
 * Cached versions for better performance
 * These use Next.js unstable_cache for server-side caching
 */
export const getCachedFeaturedNews = unstable_cache(
  getFeaturedNews,
  ["featured-news"],
  {
    revalidate: CACHE_REVALIDATE,
    tags: [CACHE_TAGS.FEATURED, CACHE_TAGS.NEWS],
  }
);

export const getCachedBreakingNews = unstable_cache(
  getBreakingNews,
  ["breaking-news"],
  {
    revalidate: CACHE_REVALIDATE,
    tags: [CACHE_TAGS.BREAKING, CACHE_TAGS.NEWS],
  }
);

export const getCachedMostViewedNews = unstable_cache(
  getMostViewedNews,
  ["most-viewed-news"],
  {
    revalidate: CACHE_REVALIDATE,
    tags: [CACHE_TAGS.MOST_VIEWED, CACHE_TAGS.NEWS],
  }
);

export const getCachedTodayRecentNews = unstable_cache(
  getTodayRecentNews,
  ["today-recent-news"],
  {
    revalidate: CACHE_REVALIDATE,
    tags: [CACHE_TAGS.RECENT, CACHE_TAGS.NEWS],
  }
);

export const getCachedPublicCategories = unstable_cache(
  getPublicCategories,
  ["public-categories"],
  {
    revalidate: CACHE_REVALIDATE * 5, // Cache categories longer (5 minutes)
    tags: [CACHE_TAGS.CATEGORY],
  }
);

