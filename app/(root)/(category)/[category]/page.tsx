import { Suspense } from "react"
import { Share2 } from "lucide-react"
import { notFound } from "next/navigation"
import { Metadata } from "next"
import { getNewsByCategory } from "@/lib/services/news-api.service"
import { prisma } from "@/lib/prisma"
import { NewsCard } from "@/components/news/news-card"
import { Button } from "@/components/ui/button"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import type { Article } from "@/constants/news-data"
import { lexicalToHTML } from "@/lib/utils/lexical-to-html"
import { mapToArticle } from "@/lib/utils/news-mapper-unified"
import type { NewsResponse } from "@/lib/services/news-api.service"

// Enterprise cache configuration
export const revalidate = 60 // Revalidate every 60 seconds

interface PageProps {
  params: Promise<{ category: string }>
  searchParams: Promise<{ page?: string }>
}

/**
 * Generate metadata for category page
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: categorySlug } = await params;
  
  const category = await prisma.menu.findUnique({
    where: { 
      slug: categorySlug, 
      isPublic: true, 
      isActive: true 
    },
    select: {
      name: true,
      slug: true,
    },
  });

  if (!category) {
    return {
      title: "Category Not Found",
    };
  }

  return {
    title: `${category.name} - News Category`,
    description: `Latest news and articles in ${category.name} category`,
    openGraph: {
      title: `${category.name} - News Category`,
      description: `Latest news and articles in ${category.name} category`,
      type: "website",
    },
  };
}

/**
 * Map database news to Article interface for NewsCard component
 */
function mapNewsToArticle(news: NewsResponse): Article {

  // Use unified mapper for base mapping
  const article = mapToArticle(news);
  
  // Convert Lexical JSON to HTML for excerpt if content exists
  if (news.content) {
    const htmlContent = lexicalToHTML(news.content);
    article.content = htmlContent;
    article.fullContent = htmlContent;
    // Update excerpt if not already set
    if (!article.excerpt && htmlContent) {
      article.excerpt = htmlContent.substring(0, 200) + "...";
    }
    // Recalculate read time based on actual content
    article.readTime = `${Math.ceil((htmlContent.length || 1000) / 500)} Mins Read`;
  }
  
  return article;
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { category: categorySlug } = await params
  const { page: pageParam } = await searchParams
  const page = Number(pageParam) || 1

  // Verify category exists and is public
  const category = await prisma.menu.findUnique({
    where: { 
      slug: categorySlug, 
      isPublic: true, 
      isActive: true 
    },
    select: {
      id: true,
      name: true,
      slug: true,
      parentId: true,
    },
  });

  // If category doesn't exist, show 404
  if (!category) {
    notFound();
  }

  // Fetch news from this category
  const result = await getNewsByCategory(
    {
      slug: categorySlug,
      includeChildren: false, // Only show direct category news
    },
    {
      page,
      limit: 24,
      includeContent: false,
      includeAuthor: true,
      includeCategories: true,
    }
  );

  // Map news to Article format for NewsCard using unified mapper
  const articles: Article[] = result.data.map(mapNewsToArticle)
  const totalPages = result.pagination.totalPages

  return (
    <div className="space-y-6">
      {/* Category Header with Share */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase">
            {category.name}
          </h1>
          {result.pagination.total > 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              {result.pagination.total} {result.pagination.total === 1 ? "article" : "articles"} found
            </p>
          )}
        </div>

        {/* <Button
          variant="outline"
          className="hidden md:flex rounded-full bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white gap-2"
        >
          <Share2 className="w-4 h-4" />
          Share
        </Button> */}
      </div>

      {/* News List with Suspense fallback */}
      <div className="flex flex-col gap-4">
        <Suspense fallback={<LoadingSkeleton />}>
          {articles.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </Suspense>

        {articles.length === 0 && (
          <div className="py-20 text-center text-zinc-500">No articles found in this category.</div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-12 py-6 border-t border-zinc-800">
          <Pagination className="text-zinc-400">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                size="default"
                  href={`/${encodeURIComponent(categorySlug)}?page=${Math.max(1, page - 1)}`}
                  className="hover:bg-zinc-800 hover:text-white"
                />
              </PaginationItem>

              {[...Array(totalPages)].map((_, i) => {
                const p = i + 1
                const isCurrent = p === page
                return (
                  <PaginationItem key={p}>
                    <PaginationLink
                     size="default"
                      href={`/${encodeURIComponent(categorySlug)}?page=${p}`}
                      isActive={isCurrent}
                      className={
                        isCurrent
                          ? "bg-zinc-100 text-black hover:bg-white"
                          : "hover:bg-zinc-800 hover:text-white"
                      }
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                )
              })}

              <PaginationItem>
                <PaginationNext
                 size="default"
                  href={`/${encodeURIComponent(categorySlug)}?page=${Math.min(totalPages, page + 1)}`}
                  className="hover:bg-zinc-800 hover:text-white"
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex flex-col md:flex-row gap-6 p-6 border border-zinc-800 rounded-xl bg-[#1a1a1a] animate-pulse"
        >
          <div className="w-full md:w-64 h-48 md:h-40 bg-zinc-800 rounded-lg" />
          <div className="flex-1 space-y-4 py-2">
            <div className="h-8 bg-zinc-800 rounded w-3/4" />
            <div className="h-4 bg-zinc-800 rounded w-1/3" />
            <div className="h-16 bg-zinc-800 rounded w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}
