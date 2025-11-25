import { notFound } from "next/navigation"
import { Metadata } from "next"
import { getNewsBySlug, getRelatedNews } from "@/lib/actions/news"
import { lexicalToHTML } from "@/lib/utils/lexical-to-html"
import { mapToArticle } from "@/lib/utils/news-mapper-unified"
import { ArticleHeader } from "./_components/article-header"
import { ArticleContent } from "./_components/article-content"
import { AuthorBio } from "./_components/author-bio"
import { RelatedPosts } from "./_components/related-posts"
import { CommentsSection } from "./_components/comments-section"
import { SocialSidebar } from "./_components/social-sidebar"
import { AdInline } from "@/components/ads/ad-inline"
import { ArticleRightSidebar } from "./_components/article-right-sidebar"
import type { Article } from "@/constants/news-data"

export const revalidate = 60

interface PageProps {
  params: Promise<{
    slug: string
  }>
  searchParams: Promise<{
    page?: string
  }>
}

// Map database news to Article interface
// Uses unified mapper with Lexical content conversion
function mapNewsToArticle(news: any): Article {
  // Use unified mapper for base mapping
  const article = mapToArticle(news);
  
  // Convert Lexical JSON to HTML if content exists
  if (news.content) {
    const htmlContent = lexicalToHTML(news.content);
    article.content = htmlContent;
    article.fullContent = htmlContent;
    // Recalculate read time based on actual content
    article.readTime = `${Math.ceil((htmlContent.length || 1000) / 500)} Mins Read`;
  }
  
  // Add meta keywords as tags if available
  if (news.metaKeywords) {
    article.tags = news.metaKeywords.split(",").map((tag: string) => tag.trim());
  }
  
  // Add comment count if available
  if (news.commentCount !== undefined) {
    article.comments = news.commentCount;
  }
  
  return article;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const result = await getNewsBySlug(slug)

  if (!result.success || !result.news) {
    return {
      title: "News Not Found",
    }
  }

  const news = result.news
  const title = news.metaTitle || news.title
  const description = news.metaDescription || news.excerpt || ""
  const image = news.ogImage || news.coverImage || ""
  console.log(news)

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: image ? [{ url: image }] : [],
      type: "article",
      publishedTime: news.publishedAt?.toISOString(),
      authors: news.author ? [news.author.username] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : [],
    },
    keywords: news.metaKeywords?.split(",").map((k: string) => k.trim()),
  }
}

export default async function Page({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { page } = await searchParams

  // Fetch news from database
  const result = await getNewsBySlug(slug)

  if (!result.success || !result.news) {
    notFound()
  }

  const article = mapNewsToArticle(result.news)

  // Get related articles
  const categoryIds = result.news.categories?.map((cat: any) => cat.menuId) || []
  const relatedResult = await getRelatedNews(slug, categoryIds, 3)
  const relatedPosts = relatedResult.success && relatedResult.news
    ? relatedResult.news.map(mapNewsToArticle)
    : []

  return (
    <div className="relative w-full bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-4 sm:py-6 lg:py-8">
        {/* Article Header includes the Hero Image. We place it full width at the top. */}
        <ArticleHeader article={article} />

        {/* 
          SECTION 1: Content + Sticky Sidebar 
          This wrapper contains ONLY the text content and the social sidebar.
          This ensures the "sticky" track ends exactly when the content ends.
        */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 xl:gap-12 relative">
          {/* Sticky Social Sidebar (Left) - Only visible alongside content */}
          <div className="hidden lg:block shrink-0 w-12">
            <div className="sticky top-24">
              <SocialSidebar />
            </div>
          </div>

          {/* Article Body (Center) */}
          <div className="flex-1 min-w-0 max-w-4xl mx-auto lg:mx-0">
            <ArticleContent content={article.fullContent || article.content} />
            
            {/* Inline Ad after content */}
            <div className="my-12">
              <AdInline showDefault={true} />
            </div>
          </div>

          {/* Right Sidebar - Live Scores and Ads */}
          <div className="hidden xl:block shrink-0 w-64">
            <div className="sticky top-24 max-h-[calc(100vh-6rem)] overflow-y-auto">
              <ArticleRightSidebar />
            </div>
          </div>
        </div>

        {/* 
          SECTION 2: Footer Components (Bio, Related, Comments)
          We start a new flex container here. We replicate the left "spacer" 
          so that these components align perfectly with the text above, 
          but without the social sidebar sticking next to them.
        */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 xl:gap-12 relative mt-12 pt-12 border-t border-border">
          {/* Spacer to maintain alignment with the content above */}
          <div className="hidden lg:block shrink-0 w-12" aria-hidden="true" />

          <div className="flex-1 min-w-0 max-w-4xl mx-auto lg:mx-0">
            <AuthorBio author={article.author} />

            <RelatedPosts posts={relatedPosts} />

            <CommentsSection newsId={result.news.id} count={(result.news as any).commentCount || article.comments || 0} />
          </div>

          {/* Right Sidebar Spacer */}
          <div className="hidden xl:block shrink-0 w-64" aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}
