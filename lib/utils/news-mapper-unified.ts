// @ts-nocheck

/**
 * Unified News Mapper System
 * 
 * Centralized mapper for all news data transformations across the application.
 * This provides a single source of truth for mapping database NewsResponse
 * to various UI component formats.
 * 
 * Benefits:
 * - Single place to manage all transformations
 * - Easy to maintain and update
 * - Consistent data formatting
 * - Type-safe mappings
 * - Extensible for future components
 */

import type { NewsResponse } from "@/lib/services/news-api.service";
import type { Article } from "@/constants/news-data";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Base article interface for most components
 */
export interface BaseArticle {
  id: string;
  title: string;
  excerpt?: string;
  image?: string;
  category?: string;
  date?: string;
  author?: string;
}

/**
 * Featured section article format
 */
export interface FeaturedArticle extends BaseArticle {
  slug: string;
  readTime?: string;
  comments?: number;
  updatedDate?: string;
  tags?: string[];
  fullContent?: string;
}

/**
 * Content sidebar article format
 */
export interface ContentSidebarArticle extends BaseArticle {
  id: string; // Uses slug
}

/**
 * Content sidebar sidebar item format
 */
export interface ContentSidebarSidebarItem {
  id: string; // Uses slug
  title: string;
  image: string;
  author?: string;
}

/**
 * Section one article format (Technology section)
 */
export interface SectionOneArticle extends BaseArticle {
  id: string; // Uses slug
  excerpt: string; // Required
  image: string; // Required
  category: string; // Required
  date: string; // Required
  author: string; // Required
  isLive?: boolean;
}

/**
 * Section one small article format
 */
export interface SectionOneSmallArticle {
  id: string; // Uses slug
  title: string;
  image: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get author name from news response
 */
function getAuthorName(news: NewsResponse): string {
  if (!news.author) return "Unknown Author";
  
  const firstName = news.author.firstName || "";
  const lastName = news.author.lastName || "";
  const fullName = `${firstName} ${lastName}`.trim();
  
  return fullName || news.author.username || "Unknown Author";
}

/**
 * Get category name from news response
 */
function getCategoryName(news: NewsResponse, fallback: string = "General"): string {
  if (news.categories && news.categories.length > 0) {
    return news.categories[0].menu.name;
  }
  return fallback;
}

/**
 * Format date from news response
 */
function formatDate(news: NewsResponse, includeTime: boolean = false): string {
  const date = news.publishedAt || news.createdAt;
  
  if (includeTime) {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }) + " IST";
  }
  
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Calculate estimated read time
 */
function calculateReadTime(contentLength: number): string {
  const wordsPerMinute = 500;
  const minutes = Math.max(1, Math.ceil(contentLength / wordsPerMinute));
  return `${minutes} Mins Read`;
}

// ============================================================================
// MAIN MAPPER FUNCTIONS
// ============================================================================

/**
 * Map NewsResponse to FeaturedArticle (for featured section)
 * This returns Article format which is compatible with FeaturedSection
 */
export function mapToFeaturedArticle(news: NewsResponse): Article {
  const authorName = getAuthorName(news);
  const category = getCategoryName(news);
  const publishedDate = formatDate(news, true);
  const updatedDate = news.updatedAt ? formatDate(news, false) : undefined;
  
  // Calculate read time from excerpt or estimate
  const contentLength = news.excerpt?.length || 1000;
  const readTime = calculateReadTime(contentLength);

  return {
    id: news.id,
    title: news.title,
    excerpt: news.excerpt || "",
    content: "", // Not included in list views
    fullContent: "", // Not included in list views
    image: news.coverImage || "/placeholder.svg?height=600&width=1200",
    author: authorName,
    source: authorName,
    date: publishedDate,
    slug: news.slug,
    category: category.toLowerCase(),
    readTime,
    comments: 0,
    updatedDate,
    tags: [],
  };
}

/**
 * Map NewsResponse to ContentSidebarArticle
 */
export function mapToContentSidebarArticle(news: NewsResponse): ContentSidebarArticle {
  const authorName = getAuthorName(news);
  const category = getCategoryName(news);
  const publishedDate = formatDate(news, false);

  return {
    id: news.slug, // Use slug for URL
    title: news.title,
    excerpt: news.excerpt || undefined,
    image: news.coverImage || undefined,
    category: category,
    date: publishedDate,
    author: authorName,
  };
}

/**
 * Map NewsResponse to ContentSidebarSidebarItem
 */
export function mapToSidebarItem(news: NewsResponse): ContentSidebarSidebarItem {
  const authorName = getAuthorName(news);

  return {
    id: news.slug, // Use slug for URL
    title: news.title,
    image: news.coverImage || "/placeholder.svg",
    author: authorName,
  };
}

/**
 * Map NewsResponse to SectionOneArticle
 */
export function mapToSectionOneArticle(
  news: NewsResponse,
  categoryName: string = "TECHNOLOGY"
): SectionOneArticle {
  const authorName = getAuthorName(news);
  const category = news.categories && news.categories.length > 0
    ? news.categories[0].menu.name.toUpperCase()
    : categoryName;
  const publishedDate = formatDate(news, false);

  return {
    id: news.slug, // Use slug for URL
    title: news.title,
    excerpt: news.excerpt || "",
    image: news.coverImage || "/placeholder.svg",
    category: category,
    date: publishedDate,
    author: authorName,
    isLive: news.isBreaking, // Use breaking news as live indicator
  };
}

/**
 * Map NewsResponse to SectionOneSmallArticle
 */
export function mapToSectionOneSmallArticle(news: NewsResponse): SectionOneSmallArticle {
  return {
    id: news.slug, // Use slug for URL
    title: news.title,
    image: news.coverImage || "/placeholder.svg",
  };
}

/**
 * Map NewsResponse to Article (for news card components)
 * This is the standard Article interface used across the app
 */
export function mapToArticle(news: NewsResponse): Article {
  const authorName = getAuthorName(news);
  const category = getCategoryName(news);
  const publishedDate = formatDate(news, true);
  const updatedDate = news.updatedAt ? formatDate(news, false) : undefined;
  
  // Calculate read time
  const contentLength = news.excerpt?.length || 1000;
  const readTime = calculateReadTime(contentLength);

  return {
    id: news.id,
    title: news.title,
    excerpt: news.excerpt || "",
    content: "", // Not included in list views
    fullContent: "", // Not included in list views
    image: news.coverImage || "/placeholder.svg?height=600&width=1200",
    author: authorName,
    source: authorName,
    date: publishedDate,
    slug: news.slug,
    category: category.toLowerCase(),
    readTime,
    comments: 0,
    updatedDate,
    tags: [],
  };
}

// ============================================================================
// BATCH MAPPER FUNCTIONS
// ============================================================================

/**
 * Map array of NewsResponse to FeaturedArticle array (Article format)
 */
export function mapArrayToFeaturedArticles(newsArray: NewsResponse[]): Article[] {
  return newsArray.map(mapToFeaturedArticle);
}

/**
 * Map array of NewsResponse to ContentSidebarArticle array
 */
export function mapArrayToContentSidebarArticles(newsArray: NewsResponse[]): ContentSidebarArticle[] {
  return newsArray.map(mapToContentSidebarArticle);
}

/**
 * Map array of NewsResponse to ContentSidebarSidebarItem array
 */
export function mapArrayToSidebarItems(newsArray: NewsResponse[]): ContentSidebarSidebarItem[] {
  return newsArray.map(mapToSidebarItem);
}

/**
 * Map array of NewsResponse to SectionOneArticle array
 */
export function mapArrayToSectionOneArticles(
  newsArray: NewsResponse[],
  categoryName: string = "TECHNOLOGY"
): SectionOneArticle[] {
  return newsArray.map((news) => mapToSectionOneArticle(news, categoryName));
}

/**
 * Map array of NewsResponse to SectionOneSmallArticle array
 */
export function mapArrayToSectionOneSmallArticles(newsArray: NewsResponse[]): SectionOneSmallArticle[] {
  return newsArray.map(mapToSectionOneSmallArticle);
}

/**
 * Map array of NewsResponse to Article array (standard format)
 */
export function mapArrayToArticles(newsArray: NewsResponse[]): Article[] {
  return newsArray.map(mapToArticle);
}

// ============================================================================
// EXPORT ALL TYPES AND FUNCTIONS
// ============================================================================

export type {
  BaseArticle,
  FeaturedArticle,
  ContentSidebarArticle,
  ContentSidebarSidebarItem,
  SectionOneArticle,
  SectionOneSmallArticle,
};

