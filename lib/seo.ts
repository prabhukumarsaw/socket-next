/**
 * SEO Utilities
 * Handles meta tags, OpenGraph, and SEO optimization for news posts
 */

export interface SEOData {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
}

/**
 * Generate meta tags for a news post
 */
export function generateNewsMetaTags(news: {
  title: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  ogImage?: string | null;
  coverImage?: string | null;
  excerpt?: string | null;
  publishedAt?: Date | null;
  updatedAt: Date;
  author?: {
    firstName?: string | null;
    lastName?: string | null;
    username: string;
  } | null;
  categories?: Array<{
    menu: {
      name: string;
      slug: string;
    };
  }>;
  slug: string;
}, baseUrl: string = "https://bawalnews.com") {
  const title = news.metaTitle || news.title;
  const description = news.metaDescription || news.excerpt || news.title;
  const keywords = news.metaKeywords || "";
  const image = news.ogImage || news.coverImage || `${baseUrl}/og-default.jpg`;
  const url = `${baseUrl}/news/${news.slug}`;
  const publishedTime = news.publishedAt?.toISOString();
  const modifiedTime = news.updatedAt.toISOString();
  const author = news.author
    ? `${news.author.firstName || ""} ${news.author.lastName || ""}`.trim() || news.author.username
    : "Bawal News";
  const section = news.categories?.[0]?.menu.name || "News";

  return {
    // Basic meta tags
    title,
    description,
    keywords,
    // OpenGraph tags
    "og:title": title,
    "og:description": description,
    "og:image": image,
    "og:url": url,
    "og:type": "article",
    "og:site_name": "Bawal News",
    "article:published_time": publishedTime,
    "article:modified_time": modifiedTime,
    "article:author": author,
    "article:section": section,
    // Twitter Card tags
    "twitter:card": "summary_large_image",
    "twitter:title": title,
    "twitter:description": description,
    "twitter:image": image,
    // Additional tags
    "news:keywords": keywords,
    canonical: url,
  };
}

/**
 * Generate structured data (JSON-LD) for a news article
 */
export function generateNewsStructuredData(news: {
  title: string;
  content: string;
  excerpt?: string | null;
  coverImage?: string | null;
  publishedAt?: Date | null;
  updatedAt: Date;
  author?: {
    firstName?: string | null;
    lastName?: string | null;
    username: string;
  } | null;
  slug: string;
}, baseUrl: string = "https://bawalnews.com") {
  const url = `${baseUrl}/news/${news.slug}`;
  const image = news.coverImage || `${baseUrl}/og-default.jpg`;
  const author = news.author
    ? {
        "@type": "Person",
        name: `${news.author.firstName || ""} ${news.author.lastName || ""}`.trim() || news.author.username,
      }
    : {
        "@type": "Organization",
        name: "Bawal News",
      };

  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: news.title,
    description: news.excerpt || news.title,
    image: image,
    datePublished: news.publishedAt?.toISOString(),
    dateModified: news.updatedAt.toISOString(),
    author: author,
    publisher: {
      "@type": "Organization",
      name: "Bawal News",
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    articleBody: news.content,
  };
}

/**
 * Generate sitemap entry for a news post
 */
export function generateSitemapEntry(news: {
  slug: string;
  updatedAt: Date;
  publishedAt?: Date | null;
}, baseUrl: string = "https://bawalnews.com") {
  return {
    url: `${baseUrl}/news/${news.slug}`,
    lastmod: news.updatedAt.toISOString(),
    changefreq: "daily",
    priority: news.publishedAt ? 0.8 : 0.5,
  };
}

