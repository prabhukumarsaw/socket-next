/**
 * Home Page Data Fetching
 * Server-side data fetching for home page with SSR optimization
 */

import { cache } from "react";
import { 
  getCachedFeaturedNews, 
  getCachedBreakingNews, 
  getCachedMostViewedNews,
  type NewsResponse 
} from "@/lib/services/news-api.service";
import { getNewsByCategory } from "@/lib/services/news-api.service";
import {
  // Unified Mapper Functions - Single Source of Truth
  mapToFeaturedArticle,
  mapToContentSidebarArticle,
  mapToSidebarItem,
  mapToSectionOneArticle,
  mapToSectionOneSmallArticle,
  mapToArticle,
  // Batch Mapper Functions
  mapArrayToFeaturedArticles,
  mapArrayToContentSidebarArticles,
  mapArrayToSidebarItems,
  mapArrayToSectionOneArticles,
  mapArrayToSectionOneSmallArticles,
  mapArrayToArticles,
  // Types
  type FeaturedArticle,
  type ContentSidebarArticle,
  type ContentSidebarSidebarItem,
  type SectionOneArticle,
  type SectionOneSmallArticle,
} from "@/lib/utils/news-mapper-unified";
import type { Article } from "@/constants/news-data";

/**
 * Fetch home page featured section data
 * Cached with React cache for SSR optimization
 * 
 * Returns:
 * - mainFeatured: 1 featured news (left column)
 * - middleFeatured: 3 more featured news (middle column)
 * - rightTopFeatured: 1 most viewed news (right column top)
 * - rightListMostViewed: 3 most viewed news (right column list)
 * - breakingNews: 4 breaking news items (News Just In)
 */
export const getHomeFeaturedData = cache(async () => {
  try {
    // Fetch all data in parallel for better performance
    // Using cached versions for optimal performance
    const [featuredNews, mostViewedNews, breakingNews] = await Promise.all([
      // Get 4 featured news (1 for main + 3 for middle column)
      getCachedFeaturedNews({
        limit: 4,
        includeAuthor: true,
        includeCategories: true,
        includeContent: false,
      }),
      // Get 4 most viewed news (1 for top + 3 for list)
      getCachedMostViewedNews({
        limit: 4,
        days: 30, // Last 30 days
        includeAuthor: true,
        includeCategories: true,
        includeContent: false,
      }),
      // Get 4 breaking news
      getCachedBreakingNews({
        limit: 4,
        includeAuthor: true,
        includeCategories: true,
        includeContent: false,
      }),
    ]);

    // Map to Article format using unified mapper
    const featuredArticles = mapArrayToFeaturedArticles(featuredNews);
    const mostViewedArticles = mapArrayToFeaturedArticles(mostViewedNews);
    const breakingArticles = mapArrayToFeaturedArticles(breakingNews);

    return {
      mainFeatured: featuredArticles[0] || null,
      middleFeatured: featuredArticles.slice(1, 4) || [], // Get 3 items (index 1, 2, 3)
      rightTopFeatured: mostViewedArticles[0] || null,
      rightListMostViewed: mostViewedArticles.slice(1, 5) || [], // Get 3 items (index 1, 2, 3)
      breakingNews: breakingArticles.slice(0, 4) || [], // Get 4 breaking news
    };
  } catch (error) {
    console.error("Error fetching home featured data:", error);
    // Return empty data on error to prevent page crash
    return {
      mainFeatured: null,
      middleFeatured: [],
      rightTopFeatured: null,
      rightListMostViewed: [],
      breakingNews: [],
    };
  }
});

/**
 * Fetch content sidebar section data
 * Fetches category-based news dynamically
 * 
 * Returns:
 * - topHeadlines: 4 articles (title only)
 * - featuredArticle: 1 featured article (JHARKHAND category)
 * - stateArticles: 6 articles (BIHAR category)
 * - moreNewsArticles: 8 articles (general/recent news)
 * - sidebarTopArticle: 1 featured article for sidebar
 * - sidebarColumns: 5 articles for Columns section
 * - sidebarOpinion: 2 left + 2 right articles
 */
export const getContentSidebarData = cache(async () => {
  try {
    // Try to get category slugs from database, with fallbacks
    // Using Promise.allSettled for graceful error handling
    const results = await Promise.allSettled([
      // JHARKHAND category - Featured Article
      getNewsByCategory(
        { slug: "jharkhand" },
        { limit: 5, includeAuthor: true, includeCategories: true, includeContent: false }
      ).catch(() => ({ data: [], pagination: { page: 1, limit: 5, total: 0, totalPages: 0, hasNext: false, hasPrev: false } })),
      
      // BIHAR category - Politics Articles  
      getNewsByCategory(
        { slug: "bihar" },
        { limit: 12, includeAuthor: true, includeCategories: true, includeContent: false }
      ).catch(() => ({ data: [], pagination: { page: 1, limit: 12, total: 0, totalPages: 0, hasNext: false, hasPrev: false } })),
      
      // Recent/General news for "More News" section - try "national" first, fallback to featured
      getNewsByCategory(
        { slug: "national" },
        { limit: 8, includeAuthor: true, includeCategories: true, includeContent: false }
      ).catch(() => getCachedFeaturedNews({ limit: 8, includeAuthor: true, includeCategories: true, includeContent: false })),
      
      // Featured news for sidebar top
      getCachedFeaturedNews({ limit: 1, includeAuthor: true, includeCategories: true, includeContent: false }),
      
      // Featured news for Columns section
      getCachedFeaturedNews({ limit: 5, includeAuthor: true, includeCategories: true, includeContent: false }),
      
      // Recent news for Opinion section
      getCachedFeaturedNews({ limit: 4, includeAuthor: true, includeCategories: true, includeContent: false }),
    ]);

    // Extract data from Promise.allSettled results
    const jharkhand = results[0].status === "fulfilled" && "data" in results[0].value ? results[0].value.data : [];
    const bihar = results[1].status === "fulfilled" && "data" in results[1].value ? results[1].value.data : [];
    const recent = results[2].status === "fulfilled" ? (Array.isArray(results[2].value) ? results[2].value : results[2].value.data || []) : [];
    const featured = results[3].status === "fulfilled" ? results[3].value : [];
    const columns = results[4].status === "fulfilled" ? results[4].value : [];
    const opinion = results[5].status === "fulfilled" ? results[5].value : [];
    const jharkhandFeatured = jharkhand.length > 0 ? mapToContentSidebarArticle(jharkhand[0]) : undefined;

    const jharkhandSupportingSource = jharkhand.length > 1
      ? jharkhand.slice(1, 5)
      : recent.slice(0, 4);
    const jharkhandSupportingArticles = mapArrayToContentSidebarArticles(jharkhandSupportingSource);

    // Map to component format using unified mapper
    const topHeadlines: ContentSidebarArticle[] = jharkhandSupportingArticles;
    const featuredArticle = jharkhandFeatured ?? (recent.length > 0 ? mapToContentSidebarArticle(recent[0]) : undefined);
    
    const stateArticles: ContentSidebarArticle[] = mapArrayToContentSidebarArticles(bihar.slice(0, 4));
    const moreNewsArticles: ContentSidebarArticle[] = mapArrayToContentSidebarArticles(bihar.slice(4, 10));
    
    const sidebarTopArticle: ContentSidebarSidebarItem | undefined = featured.length > 0
      ? mapToSidebarItem(featured[0])
      : (recent.length > 0 ? mapToSidebarItem(recent[0]) : undefined);
    
    const sidebarColumns: ContentSidebarSidebarItem[] = mapArrayToSidebarItems(columns.slice(0, 5));
    
    // Split opinion news into left and right
    const opinionArticles = mapArrayToContentSidebarArticles(opinion.slice(0, 4));
    const sidebarOpinion = opinionArticles.length >= 4
      ? {
          left: opinionArticles.slice(0, 2),
          right: opinionArticles.slice(2, 4),
        }
      : undefined;

    return {
      topHeadlines: topHeadlines.length > 0 ? topHeadlines : [],
      featuredArticle: featuredArticle,
      stateArticles: stateArticles.length > 0 ? stateArticles : [],
      moreNewsArticles: moreNewsArticles.length > 0 ? moreNewsArticles : [],
      sidebarTopArticle: sidebarTopArticle,
      sidebarColumns: sidebarColumns.length > 0 ? sidebarColumns : [],
      sidebarOpinion: sidebarOpinion,
    };
  } catch (error) {
    console.error("Error fetching content sidebar data:", error);
    // Return empty data on error
    return {
      topHeadlines: [],
      featuredArticle: undefined,
      stateArticles: [],
      moreNewsArticles: [],
      sidebarTopArticle: undefined,
      sidebarColumns: [],
      sidebarOpinion: undefined,
    };
  }
});

/**
 * Fetch Technology section data
 * Fetches TECHNOLOGY category news for section-one component
 * 
 * Returns:
 * - categoryName: The actual category name from database (e.g., "Technology", "TECHNOLOGY")
 * - featuredArticle: 1 featured article from TECHNOLOGY category
 * - sideArticles: 2 stacked articles from TECHNOLOGY category
 * - rightArticles: 4-6 articles for bottom grid from TECHNOLOGY category
 */
export const getTechnologySectionData = cache(async () => {
  try {
    // Try multiple technology category slug variations
    const possibleSlugs = ["technology", "tech", "technologies"];
    let technologyNews: NewsResponse[] = [];
    let categoryName = "TECHNOLOGY"; // Default fallback

    // Try each slug variation
    for (const slug of possibleSlugs) {
      try {
        const result = await getNewsByCategory(
          { slug, includeChildren: false },
          { limit: 7, includeAuthor: true, includeCategories: true, includeContent: false }
        );
        
        if (result.data.length > 0) {
          technologyNews = result.data;
          // Get category name from first article
          if (result.data[0]?.categories && result.data[0].categories.length > 0) {
            categoryName = result.data[0].categories[0].menu.name.toUpperCase();
          }
          break; // Found news, exit loop
        }
      } catch (error) {
        // Continue to next slug variation
        continue;
      }
    }

    // If no technology news found, use featured news as fallback
    if (technologyNews.length === 0) {
      const featuredFallback = await getCachedFeaturedNews({
        limit: 7,
        includeAuthor: true,
        includeCategories: true,
        includeContent: false,
      });
      technologyNews = featuredFallback;
      // Try to get category name from featured news
      if (featuredFallback[0]?.categories && featuredFallback[0].categories.length > 0) {
        categoryName = featuredFallback[0].categories[0].menu.name.toUpperCase();
      }
    }

    // Map to component format using unified mapper
    const featuredArticle: SectionOneArticle = technologyNews.length > 0
      ? mapToSectionOneArticle(technologyNews[0], categoryName)
      : {
          id: "",
          title: "",
          excerpt: "",
          image: "/placeholder.svg",
          category: categoryName,
          date: "",
          author: "",
        };

    const sideArticles: SectionOneArticle[] = mapArrayToSectionOneArticles(
      technologyNews.slice(1, 3),
      categoryName
    );

    const rightArticles: SectionOneSmallArticle[] = mapArrayToSectionOneSmallArticles(
      technologyNews.slice(3, 7) // Get 4 items for bottom grid
    );

    return {
      categoryName,
      featuredArticle,
      sideArticles: sideArticles.length > 0 ? sideArticles : [],
      rightArticles: rightArticles.length > 0 ? rightArticles : [],
    };
  } catch (error) {
    console.error("Error fetching technology section data:", error);
    // Return empty data on error
    return {
      categoryName: "TECHNOLOGY",
      featuredArticle: {
        id: "",
        title: "",
        excerpt: "",
        image: "/placeholder.svg",
        category: "TECHNOLOGY",
        date: "",
        author: "",
      },
      sideArticles: [],
      rightArticles: [],
    };
  }
});
