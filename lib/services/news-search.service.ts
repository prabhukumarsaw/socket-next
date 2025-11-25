/**
 * Advanced News Search Service
 * 
 * Provides server-side search functionality with:
 * - Full-text search on title, content, excerpt
 * - Category filtering
 * - Author filtering
 * - Date range filtering
 * - Sorting options
 * - Pagination
 * - Search result highlighting
 */

import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

/**
 * Search options
 */
export interface SearchOptions {
  query: string; // Search query
  category?: string; // Category slug filter
  authorId?: string; // Author ID filter
  dateFrom?: Date; // Start date
  dateTo?: Date; // End date
  sortBy?: "relevance" | "date" | "views" | "likes"; // Sort option
  page?: number;
  limit?: number;
  includeContent?: boolean; // Include full content in results
}

/**
 * Search result with relevance score
 */
export interface SearchResult {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content?: string;
  coverImage: string | null;
  isBreaking: boolean;
  isFeatured: boolean;
  viewCount: number;
  likes: number;
  publishedAt: Date | null;
  createdAt: Date;
  relevanceScore?: number; // For relevance sorting
  author: {
    id: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
  };
  categories: Array<{
    id: string;
    menu: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  highlights?: {
    title?: string[];
    excerpt?: string[];
    content?: string[];
  };
}

/**
 * Paginated search response
 */
export interface SearchResponse {
  results: SearchResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  meta: {
    query: string;
    filters: {
      category?: string;
      authorId?: string;
      dateFrom?: string;
      dateTo?: string;
    };
    sortBy: string;
    executionTime: number;
  };
}

/**
 * Calculate relevance score for search results
 * Higher score = more relevant
 */
function calculateRelevanceScore(
  news: any,
  query: string,
  queryLower: string
): number {
  let score = 0;
  const title = news.title?.toLowerCase() || "";
  const excerpt = news.excerpt?.toLowerCase() || "";
  const content = news.content?.toLowerCase() || "";

  // Exact title match (highest priority)
  if (title === queryLower) {
    score += 100;
  } else if (title.includes(queryLower)) {
    score += 50;
  }

  // Title word matches
  const titleWords = title.split(/\s+/);
  const queryWords = queryLower.split(/\s+/);
  queryWords.forEach((qWord) => {
    if (titleWords.includes(qWord)) {
      score += 30;
    }
  });

  // Excerpt match
  if (excerpt.includes(queryLower)) {
    score += 20;
  }

  // Content match (lower priority)
  if (content.includes(queryLower)) {
    score += 10;
  }

  // Boost for featured/breaking news
  if (news.isFeatured) score += 5;
  if (news.isBreaking) score += 5;

  // Boost for recent news
  if (news.publishedAt) {
    const daysSincePublished =
      (Date.now() - new Date(news.publishedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSincePublished < 7) score += 5;
    if (daysSincePublished < 1) score += 10;
  }

  return score;
}

/**
 * Highlight search terms in text
 */
function highlightText(text: string, query: string): string[] {
  if (!text || !query) return [];
  
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();
  const highlights: string[] = [];
  
  // Find all occurrences
  let index = textLower.indexOf(queryLower);
  let found = 0;
  
  while (index !== -1 && found < 3) { // Limit to 3 highlights
    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + query.length + 50);
    const snippet = text.substring(start, end);
    highlights.push(snippet);
    index = textLower.indexOf(queryLower, index + 1);
    found++;
  }
  
  return highlights;
}

/**
 * Advanced news search
 * Supports full-text search with filtering and sorting
 */
export async function searchNews(options: SearchOptions): Promise<SearchResponse> {
  const startTime = Date.now();
  
  const {
    query,
    category,
    authorId,
    dateFrom,
    dateTo,
    sortBy = "relevance",
    page = 1,
    limit = 10,
    includeContent = false,
  } = options;

  const skip = (page - 1) * limit;
  const queryLower = query.toLowerCase().trim();

  // Build where clause
  const where: any = {
    isPublished: true,
    isActive: true,
    // Only show published news
    AND: [
      {
        OR: [
          { publishedAt: { lte: new Date() } },
          { publishedAt: null, createdAt: { lte: new Date() } },
        ],
      },
      // Full-text search on title, excerpt, and content
      {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { excerpt: { contains: query, mode: "insensitive" } },
          { content: { contains: query, mode: "insensitive" } },
        ],
      },
    ],
  };

  // Category filter
  if (category) {
    const categoryMenu = await prisma.menu.findUnique({
      where: { slug: category, isPublic: true, isActive: true },
    });
    
    if (categoryMenu) {
      where.categories = {
        some: {
          menuId: categoryMenu.id,
        },
      };
    }
  }

  // Author filter
  if (authorId) {
    where.authorId = authorId;
  }

  // Date range filter
  if (dateFrom || dateTo) {
    where.publishedAt = {};
    if (dateFrom) {
      where.publishedAt.gte = dateFrom;
    }
    if (dateTo) {
      where.publishedAt.lte = dateTo;
    }
  }

  // Get total count
  const total = await prisma.news.count({ where });

  // Build orderBy based on sort option
  let orderBy: any[] = [];
  if (sortBy === "relevance") {
    // For relevance, we'll fetch all and sort in memory
    // This is acceptable for reasonable result sets
    orderBy = [{ publishedAt: "desc" }];
  } else if (sortBy === "date") {
    orderBy = [{ publishedAt: "desc" }, { createdAt: "desc" }];
  } else if (sortBy === "views") {
    orderBy = [{ viewCount: "desc" }, { publishedAt: "desc" }];
  } else if (sortBy === "likes") {
    orderBy = [{ likes: "desc" }, { publishedAt: "desc" }];
  }

  // Fetch news
  const news = await prisma.news.findMany({
    where,
    skip,
    take: limit,
    orderBy,
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
      author: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
        },
      },
      categories: {
        select: {
          id: true,
          menu: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
    },
  });

  // Calculate relevance scores and add highlights
  const results: SearchResult[] = news.map((item) => {
    const relevanceScore = calculateRelevanceScore(item, query, queryLower);
    
    return {
      ...item,
      relevanceScore,
      highlights: {
        title: highlightText(item.title, query),
        excerpt: item.excerpt ? highlightText(item.excerpt, query) : [],
        content: includeContent && item.content
          ? highlightText(item.content.substring(0, 500), query) // Limit content highlights
          : [],
      },
    } as SearchResult;
  });

  // Sort by relevance if needed
  if (sortBy === "relevance") {
    results.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
  }

  const executionTime = Date.now() - startTime;

  return {
    results,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
    meta: {
      query,
      filters: {
        category,
        authorId,
        dateFrom: dateFrom?.toISOString(),
        dateTo: dateTo?.toISOString(),
      },
      sortBy,
      executionTime,
    },
  };
}

/**
 * Quick search (for autocomplete/suggestions)
 * Returns only titles and slugs for fast response
 */
export async function quickSearch(query: string, limit: number = 5) {
  const queryLower = query.toLowerCase().trim();

  if (queryLower.length < 2) {
    return [];
  }

  const news = await prisma.news.findMany({
    where: {
      isPublished: true,
      isActive: true,
      OR: [
        { publishedAt: { lte: new Date() } },
        { publishedAt: null, createdAt: { lte: new Date() } },
      ],
      title: { contains: query, mode: "insensitive" },
    },
    select: {
      id: true,
      title: true,
      slug: true,
      coverImage: true,
      publishedAt: true,
    },
    take: limit,
    orderBy: [
      { publishedAt: "desc" },
      { createdAt: "desc" },
    ],
  });

  return news;
}

/**
 * Cached quick search for better performance
 */
export const getCachedQuickSearch = unstable_cache(
  quickSearch,
  ["quick-search"],
  {
    revalidate: 60, // 1 minute
    tags: ["news-search"],
  }
);
