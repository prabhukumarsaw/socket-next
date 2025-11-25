/**
 * Search Results Page
 * 
 * Displays search results with filtering and sorting options
 */

import { Suspense } from "react";
import { SearchResults } from "./_components/search-results";
import { SearchFilters } from "./_components/search-filters";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    authorId?: string;
    dateFrom?: string;
    dateTo?: string;
    isBreaking?: string;
    isFeatured?: string;
    sortBy?: string;
    page?: string;
  }>;
}

export default async function SearchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params.q || "";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {query ? `Search Results for "${query}"` : "Search News"}
        </h1>
        {!query && (
          <p className="text-muted-foreground">
            Enter a search query to find news articles
          </p>
        )}
      </div>

      {query && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <aside className="lg:col-span-1">
            <Suspense fallback={<div>Loading filters...</div>}>
              <SearchFilters />
            </Suspense>
          </aside>

          {/* Search Results */}
          <div className="lg:col-span-3">
            <Suspense fallback={<div>Loading results...</div>}>
              <SearchResults searchParams={params} />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
}

