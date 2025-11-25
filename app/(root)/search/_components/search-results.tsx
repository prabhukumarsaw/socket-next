/**
 * Search Results Component
 * 
 * Displays paginated search results with loading states
 */

"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Loader2, Calendar, Eye, Heart, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewsCard } from "@/components/news/news-card";

interface SearchResultsProps {
  searchParams: {
    q?: string;
    category?: string;
    authorId?: string;
    dateFrom?: string;
    dateTo?: string;
    isBreaking?: string;
    isFeatured?: string;
    sortBy?: string;
    page?: string;
  };
}

export function SearchResults({ searchParams }: SearchResultsProps) {
  const router = useRouter();
  const [results, setResults] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function performSearch() {
      if (!searchParams.q || searchParams.q.length < 2) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        Object.entries(searchParams).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });

        const response = await fetch(`/api/news/search?${params.toString()}`);
        const data = await response.json();

        if (data.success) {
          setResults(data.data);
        } else {
          setError(data.error || "Search failed");
        }
      } catch (err) {
        setError("Failed to perform search");
        console.error("Search error:", err);
      } finally {
        setIsLoading(false);
      }
    }

    performSearch();
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Searching...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">{error}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.refresh()}
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (!searchParams.q || searchParams.q.length < 2) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Enter at least 2 characters to search
        </p>
      </div>
    );
  }

  if (!results || results.results.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-2">No results found</p>
        <p className="text-sm text-muted-foreground">
          Try different keywords or adjust your filters
        </p>
      </div>
    );
  }

  const { results: news, pagination, meta } = results;

  return (
    <div>
      {/* Search Meta */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Found {pagination.total} result{pagination.total !== 1 ? "s" : ""} in{" "}
          {meta.searchTime}ms
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <select
            value={searchParams.sortBy || "relevance"}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams as any);
              params.set("sortBy", e.target.value);
              params.set("page", "1");
              router.push(`/search?${params.toString()}`);
            }}
            className="text-sm border rounded px-2 py-1"
          >
            <option value="relevance">Relevance</option>
            <option value="date">Date</option>
            <option value="views">Most Viewed</option>
            <option value="likes">Most Liked</option>
          </select>
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-4">
        {news.map((item: any) => (
          <Link
            key={item.id}
            href={`/news/${item.slug}`}
            className="block p-4 border rounded-lg hover:bg-accent transition-colors"
          >
            <div className="flex gap-4">
              {item.coverImage && (
                <div className="relative w-32 h-32 flex-shrink-0 rounded overflow-hidden">
                  <Image
                    src={item.coverImage}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  {item.isBreaking && (
                    <span className="px-2 py-0.5 text-xs font-semibold bg-red-500 text-white rounded">
                      Breaking
                    </span>
                  )}
                  {item.isFeatured && (
                    <span className="px-2 py-0.5 text-xs font-semibold bg-blue-500 text-white rounded">
                      Featured
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                  <span
                    dangerouslySetInnerHTML={{
                      __html: item.highlights?.title || item.title,
                    }}
                  />
                </h3>
                {item.highlights?.excerpt && (
                  <p
                    className="text-sm text-muted-foreground mb-2 line-clamp-2"
                    dangerouslySetInnerHTML={{
                      __html: item.highlights.excerpt,
                    }}
                  />
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{item.author.username}</span>
                  {item.publishedAt && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(item.publishedAt).toLocaleDateString()}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {item.viewCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    {item.likes}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            disabled={!pagination.hasPrev}
            onClick={() => {
              const params = new URLSearchParams(searchParams as any);
              params.set("page", String(pagination.page - 1));
              router.push(`/search?${params.toString()}`);
            }}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={!pagination.hasNext}
            onClick={() => {
              const params = new URLSearchParams(searchParams as any);
              params.set("page", String(pagination.page + 1));
              router.push(`/search?${params.toString()}`);
            }}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

