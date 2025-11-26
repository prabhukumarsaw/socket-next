// @ts-nocheck

/**
 * Category Section Mapper Utility
 * Maps database NewsResponse to CategoryNewsSection component formats
 */

import type { NewsResponse } from "@/lib/services/news-api.service";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Category Block Type A (Featured + Sub Articles)
 */
export interface CategoryBlockTypeAData {
  title: string;
  featured: {
    title: string;
    author: string;
    date: string;
    excerpt: string;
    image: string;
    slug?: string; // For linking
  };
  subArticles: Array<{
    title: string;
    slug?: string; // For linking
  }>;
}

/**
 * Category Block Type B (Featured + Middle + Bottom)
 */
export interface CategoryBlockTypeBData {
  title: string;
  featured: {
    title: string;
    excerpt: string;
    image: string;
    slug?: string; // For linking
  };
  middleArticles: Array<{
    title: string;
    image: string;
    slug?: string; // For linking
  }>;
  bottomArticles: Array<{
    title: string;
    slug?: string; // For linking
  }>;
}

/**
 * Top Trending Item
 */
export interface TopTrendingItem {
  id: number;
  title: string;
  image: string;
  slug: string;
}

/**
 * Exclusive News Item
 */
export interface ExclusiveNewsItem {
  title: string;
  image: string;
  slug: string;
}

/**
 * Sidebar Small List Item
 */
export interface SidebarSmallListItem {
  title: string;
  image: string;
  slug: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getAuthorName(news: NewsResponse): string {
  if (!news.author) return "UNKNOWN AUTHOR";
  
  const firstName = news.author.firstName || "";
  const lastName = news.author.lastName || "";
  const fullName = `${firstName} ${lastName}`.trim();
  
  return (fullName || news.author.username || "UNKNOWN AUTHOR").toUpperCase();
}

function formatDate(news: NewsResponse): string {
  const date = news.publishedAt || news.createdAt;
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ============================================================================
// MAPPER FUNCTIONS
// ============================================================================

/**
 * Map NewsResponse to CategoryBlockTypeA format
 */
export function mapToCategoryBlockTypeA(
  title: string,
  featured: NewsResponse,
  subArticles: NewsResponse[]
): CategoryBlockTypeAData {
  return {
    title,
    featured: {
      title: featured.title,
      author: getAuthorName(featured),
      date: formatDate(featured),
      excerpt: featured.excerpt || "",
      image: featured.coverImage || "/placeholder.svg",
      slug: featured.slug,
    },
    subArticles: subArticles.map((article) => ({
      title: article.title,
      slug: article.slug,
    })),
  };
}

/**
 * Map NewsResponse to CategoryBlockTypeB format
 */
export function mapToCategoryBlockTypeB(
  title: string,
  featured: NewsResponse,
  middleArticles: NewsResponse[],
  bottomArticles: NewsResponse[]
): CategoryBlockTypeBData {
  return {
    title,
    featured: {
      title: featured.title,
      excerpt: featured.excerpt || "",
      image: featured.coverImage || "/placeholder.svg",
      slug: featured.slug,
    },
    middleArticles: middleArticles.map((article) => ({
      title: article.title,
      image: article.coverImage || "/placeholder.svg",
      slug: article.slug,
    })),
    bottomArticles: bottomArticles.map((article) => ({
      title: article.title,
      slug: article.slug,
    })),
  };
}

/**
 * Map NewsResponse to TopTrendingItem format
 */
export function mapToTopTrendingItem(news: NewsResponse, index: number): TopTrendingItem {
  return {
    id: index + 1,
    title: news.title,
    image: news.coverImage || "/placeholder.svg",
    slug: news.slug,
  };
}

/**
 * Map NewsResponse to ExclusiveNewsItem format
 */
export function mapToExclusiveNewsItem(news: NewsResponse): ExclusiveNewsItem {
  return {
    title: news.title,
    image: news.coverImage || "/placeholder.svg",
    slug: news.slug,
  };
}

/**
 * Map NewsResponse to SidebarSmallListItem format
 */
export function mapToSidebarSmallListItem(news: NewsResponse): SidebarSmallListItem {
  return {
    title: news.title,
    image: news.coverImage || "/placeholder.svg",
    slug: news.slug,
  };
}

// ============================================================================
// BATCH MAPPER FUNCTIONS
// ============================================================================

/**
 * Map array of NewsResponse to TopTrendingItem array
 */
export function mapArrayToTopTrendingItems(newsArray: NewsResponse[]): TopTrendingItem[] {
  return newsArray.map((news, index) => mapToTopTrendingItem(news, index));
}

/**
 * Map array of NewsResponse to ExclusiveNewsItem array
 */
export function mapArrayToExclusiveNewsItems(newsArray: NewsResponse[]): ExclusiveNewsItem[] {
  return newsArray.map(mapToExclusiveNewsItem);
}

/**
 * Map array of NewsResponse to SidebarSmallListItem array
 */
export function mapArrayToSidebarSmallListItems(newsArray: NewsResponse[]): SidebarSmallListItem[] {
  return newsArray.map(mapToSidebarSmallListItem);
}

// Export all types
export type {
  CategoryBlockTypeAData,
  CategoryBlockTypeBData,
  TopTrendingItem,
  ExclusiveNewsItem,
  SidebarSmallListItem,
};

