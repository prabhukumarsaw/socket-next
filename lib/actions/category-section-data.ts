/**
 * Category Section Data Fetching
 * Server-side data fetching for category news section with SSR optimization
 */

import { cache } from "react";
import { 
  getCachedFeaturedNews,
  getCachedMostViewedNews,
  getNewsByCategory,
  type NewsResponse 
} from "@/lib/services/news-api.service";
import {
  mapToCategoryBlockTypeA,
  mapToCategoryBlockTypeB,
  mapArrayToTopTrendingItems,
  mapArrayToExclusiveNewsItems,
  mapArrayToSidebarSmallListItems,
  type CategoryBlockTypeAData,
  type CategoryBlockTypeBData,
  type TopTrendingItem,
  type ExclusiveNewsItem,
  type SidebarSmallListItem,
} from "@/lib/utils/category-section-mapper";

/**
 * Fetch Top Trending News
 * Returns most viewed news from the last 7 days
 */
export const getTopTrendingNews = cache(async (limit: number = 5): Promise<TopTrendingItem[]> => {
  try {
    const news = await getCachedMostViewedNews({
      limit,
      days: 7, // Last 7 days for trending
      includeAuthor: true,
      includeCategories: true,
      includeContent: false,
    });
    
    return mapArrayToTopTrendingItems(news);
  } catch (error) {
    console.error("Error fetching top trending news:", error);
    return [];
  }
});

/**
 * Fetch Exclusive News
 * Returns featured news (can be filtered by specific criteria later)
 */
export const getExclusiveNews = cache(async (limit: number = 4): Promise<ExclusiveNewsItem[]> => {
  try {
    // Exclusive news can be featured news or news with specific tag
    // For now, using featured news as exclusive
    const news = await getCachedFeaturedNews({
      limit,
      includeAuthor: true,
      includeCategories: true,
      includeContent: false,
    });
    
    return mapArrayToExclusiveNewsItems(news);
  } catch (error) {
    console.error("Error fetching exclusive news:", error);
    return [];
  }
});

/**
 * Fetch Category Section Data
 * Fetches all category-based sections dynamically
 * 
 * Returns:
 * - politics: Category block type A for politics
 * - sports: Category block type A for sports
 * - entertainment: Category block type B for entertainment
 * - topTrending: Top trending items for sidebar
 * - exclusiveNews: Exclusive news items for sidebar
 * - sidebarBottom: Small list items for sidebar bottom
 */
export const getCategorySectionData = cache(async () => {
  try {
    // Fetch all data in parallel for optimal performance
    const results = await Promise.allSettled([
      // Currencies & Crypto category (or business/economy)
      getNewsByCategory(
        { slug: "politics", includeChildren: false },
        { limit: 5, includeAuthor: true, includeCategories: true, includeContent: false }
      ).catch(() => getNewsByCategory(
        { slug: "politics", includeChildren: false },
        { limit: 5, includeAuthor: true, includeCategories: true, includeContent: false }
      )).catch(() => ({ data: [], pagination: { page: 1, limit: 5, total: 0, totalPages: 0, hasNext: false, hasPrev: false } })),
      
      // Sports category
      getNewsByCategory(
        { slug: "sports", includeChildren: false },
        { limit: 5, includeAuthor: true, includeCategories: true, includeContent: false }
      ).catch(() => ({ data: [], pagination: { page: 1, limit: 5, total: 0, totalPages: 0, hasNext: false, hasPrev: false } })),
      
      // entertainment/International category
      getNewsByCategory(
        { slug: "entertainment", includeChildren: false },
        { limit: 9, includeAuthor: true, includeCategories: true, includeContent: false }
      ).catch(() => getNewsByCategory(
        { slug: "entertainment", includeChildren: false },
        { limit: 9, includeAuthor: true, includeCategories: true, includeContent: false }
      )).catch(() => ({ data: [], pagination: { page: 1, limit: 9, total: 0, totalPages: 0, hasNext: false, hasPrev: false } })),
      
       // crime category
       getNewsByCategory(
        { slug: "crime", includeChildren: false },
        { limit: 5, includeAuthor: true, includeCategories: true, includeContent: false }
      ).catch(() => ({ data: [], pagination: { page: 1, limit: 5, total: 0, totalPages: 0, hasNext: false, hasPrev: false } })),
      

      // Top Trending (most viewed last 7 days)
      getCachedMostViewedNews({
        limit: 5,
        days: 7,
        includeAuthor: true,
        includeCategories: true,
        includeContent: false,
      }),
      
      // Exclusive News (featured)
      getCachedFeaturedNews({
        limit: 4,
        includeAuthor: true,
        includeCategories: true,
        includeContent: false,
      }),
      
      // Sidebar Bottom (recent featured)
      getCachedFeaturedNews({
        limit: 6,
        includeAuthor: true,
        includeCategories: true,
        includeContent: false,
      }),
    ]);

    // Extract data from results
    const politicsResult = results[0].status === "fulfilled" && "data" in results[0].value 
      ? results[0].value.data 
      : [];
    const sportsResult = results[1].status === "fulfilled" && "data" in results[1].value 
      ? results[1].value.data 
      : [];
    const entertainmentResult = results[2].status === "fulfilled" && "data" in results[2].value 
      ? results[2].value.data 
      : [];

    const crimeResult = results[3].status === "fulfilled" && "data" in results[3].value 
      ? results[3].value.data 
      : [];
    const topTrendingNews = results[4].status === "fulfilled" ? results[4].value : [];
    const exclusiveNews = results[5].status === "fulfilled" ? results[5].value : [];
    const sidebarBottomNews = results[6].status === "fulfilled" ? results[6].value : [];

    // Get category names
    const politicsTitle = politicsResult[0]?.categories?.[0]?.menu?.name?.toUpperCase() || "राजनीति";
    const sportsTitle = sportsResult[0]?.categories?.[0]?.menu?.name?.toUpperCase() || "खेल";
    const entertainmentTitle = entertainmentResult[0]?.categories?.[0]?.menu?.name?.toUpperCase() || "मनोरंजन";
    const crimeTitle = crimeResult[0]?.categories?.[0]?.menu?.name?.toUpperCase() || "क्राइम";
    // Map to component formats
    const politics: CategoryBlockTypeAData = politicsResult.length > 0
      ? mapToCategoryBlockTypeA(
        politicsTitle,
          politicsResult[0],
          politicsResult.slice(1, 5)
        )
      : {
          title: politicsTitle,
          featured: {
            title: "",
            author: "",
            date: "",
            excerpt: "",
            image: "/placeholder.svg",
          },
          subArticles: [],
        };

    const sports: CategoryBlockTypeAData = sportsResult.length > 0
      ? mapToCategoryBlockTypeA(
          sportsTitle,
          sportsResult[0],
          sportsResult.slice(1, 5)
        )
      : {
          title: sportsTitle,
          featured: {
            title: "",
            author: "",
            date: "",
            excerpt: "",
            image: "/placeholder.svg",
          },
          subArticles: [],
        };

    const entertainment: CategoryBlockTypeBData = entertainmentResult.length > 0
      ? mapToCategoryBlockTypeB(
        entertainmentTitle,
        entertainmentResult[0],
        entertainmentResult.slice(1, 5), // 4 middle articles
        entertainmentResult.slice(5, 9)  // 4 bottom articles
        )
      : {
          title: entertainmentTitle,
          featured: {
            title: "",
            excerpt: "",
            image: "/placeholder.svg",
          },
          middleArticles: [],
          bottomArticles: [],
        };

        const crime: CategoryBlockTypeAData = crimeResult.length > 0
        ? mapToCategoryBlockTypeA(
          crimeTitle,
          crimeResult[0],
          crimeResult.slice(1, 5)
          )
        : {
            title: crimeTitle,
            featured: {
              title: "",
              author: "",
              date: "",
              excerpt: "",
              image: "/placeholder.svg",
            },
            subArticles: [],
          };

    const topTrending: TopTrendingItem[] = mapArrayToTopTrendingItems(topTrendingNews);
    const exclusive: ExclusiveNewsItem[] = mapArrayToExclusiveNewsItems(exclusiveNews);
    const sidebarBottom: SidebarSmallListItem[] = mapArrayToSidebarSmallListItems(sidebarBottomNews.slice(0, 6));

    return {
      politics,
      sports,
      entertainment,
      crime,
      topTrending,
      exclusiveNews: exclusive,
      sidebarBottom,
    };
  } catch (error) {
    console.error("Error fetching category section data:", error);
    // Return empty data on error
    return {
      politics: {
        title: "राजनीति",
        featured: {
          title: "",
          author: "",
          date: "",
          excerpt: "",
          image: "/placeholder.svg",
        },
        subArticles: [],
      },
      sports: {
        title: "SPORTS",
        featured: {
          title: "",
          author: "",
          date: "",
          excerpt: "",
          image: "/placeholder.svg",
        },
        subArticles: [],
      },
      entertainment: {
        title: "मनोरंजन",
        featured: {
          title: "",
          excerpt: "",
          image: "/placeholder.svg",
        },
        middleArticles: [],
        bottomArticles: [],
      },
      crime: {
        title: "CRIME",
        featured: {
          title: "",
          author: "",
          date: "",
          excerpt: "",
          image: "/placeholder.svg",
        },
        subArticles: [],
      },
      topTrending: [],
      exclusiveNews: [],
      sidebarBottom: [],
    };
  }
});

