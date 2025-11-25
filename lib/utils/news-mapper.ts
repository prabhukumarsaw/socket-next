/**
 * @deprecated This file is deprecated. Use lib/utils/news-mapper-unified.ts instead.
 * 
 * This file is kept for backward compatibility.
 * All new code should use the unified mapper system.
 */

// Re-export from unified mapper for backward compatibility
export {
  mapToArticle as mapNewsToArticle,
  mapArrayToArticles as mapNewsArrayToArticles,
} from "./news-mapper-unified";
