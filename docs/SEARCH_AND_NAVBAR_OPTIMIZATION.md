# Advanced Search System & Navbar Optimization

## Overview

This document describes the advanced news search system and navbar optimization implemented for fast, efficient news discovery and navigation.

## Features Implemented

### 1. Advanced News Search API

**Endpoint:** `GET /api/news/search`

**Features:**
- Full-text search on title, content, and excerpt
- Category filtering
- Author filtering
- Date range filtering
- Sorting options (relevance, date, views, likes)
- Pagination support
- Quick search mode for autocomplete
- Search result highlighting
- Relevance scoring

**Query Parameters:**
- `q` (required): Search query (min 2 characters)
- `quick` (optional): Quick search mode for autocomplete (returns limited results)
- `category`: Filter by category slug
- `authorId`: Filter by author ID
- `dateFrom`: Start date (ISO string)
- `dateTo`: End date (ISO string)
- `sortBy`: Sort option (relevance|date|views|likes)
- `page`: Page number
- `limit`: Results per page (max 50)
- `includeContent`: Include full content in results

**Example Requests:**

```bash
# Quick search (for autocomplete)
GET /api/news/search?q=cricket&quick=true&limit=5

# Full search with filters
GET /api/news/search?q=india&category=sport&sortBy=relevance&page=1&limit=10

# Search by author
GET /api/news/search?q=news&authorId=clx123&sortBy=date
```

**Response Format:**

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "clx...",
        "title": "News Title",
        "slug": "news-slug",
        "excerpt": "News excerpt...",
        "coverImage": "https://...",
        "relevanceScore": 85,
        "highlights": {
          "title": ["...matched text..."],
          "excerpt": ["...matched text..."]
        },
        "author": {...},
        "categories": [...]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 45,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    },
    "meta": {
      "query": "cricket",
      "filters": {...},
      "sortBy": "relevance",
      "executionTime": 45
    }
  }
}
```

### 2. Search Service Layer

**File:** `lib/services/news-search.service.ts`

**Functions:**
- `searchNews()`: Full-featured search with all filters
- `quickSearch()`: Fast autocomplete search
- `calculateRelevanceScore()`: Intelligent relevance scoring
- `highlightText()`: Search term highlighting

**Relevance Scoring Algorithm:**
- Exact title match: +100 points
- Title contains query: +50 points
- Title word matches: +30 points each
- Excerpt match: +20 points
- Content match: +10 points
- Featured news: +5 points
- Breaking news: +5 points
- Recent news (< 7 days): +5 points
- Today's news: +10 points

### 3. Navbar Optimization

**File:** `components/home/Header/Navbar.tsx`

**Optimizations:**

1. **Server-Side Menu Loading**
   - Menus are fetched server-side in the layout
   - Passed as props to Navbar component
   - Eliminates initial API call delay
   - Zero loading time for menus on first render

2. **Client-Side Caching**
   - localStorage cache with 5-minute expiry
   - Background refresh for stale cache
   - Fallback to API if server-side props not available

3. **Search Integration**
   - SearchBar component with debounced search
   - Real-time autocomplete suggestions
   - Keyboard navigation support
   - Mobile and desktop variants

**Menu Loading Strategy:**

```typescript
// Server-side (layout.tsx)
const menus = await getCachedPublicMenusTree();
<Navbar menus={menus} />

// Client-side (Navbar.tsx)
// 1. Use server-side menus if provided (instant)
// 2. Check localStorage cache (fast)
// 3. Fetch from API (fallback)
```

### 4. SearchBar Component

**File:** `components/news/search-bar.tsx`

**Features:**
- Debounced search (300ms)
- Autocomplete suggestions
- Keyboard navigation (Arrow keys, Enter, Escape)
- Click outside to close
- Mobile and desktop variants
- Image thumbnails in results
- "View all results" option

**Search Flow:**
1. User types query (min 2 characters)
2. Debounced API call after 300ms
3. Quick search API returns top 5 results
4. Results displayed in dropdown
5. User can:
   - Click result to navigate
   - Press Enter to view all results
   - Use arrow keys to navigate

## Performance Optimizations

### 1. Caching Strategy

**Server-Side:**
- Next.js `unstable_cache` with 60s revalidation
- Tag-based cache invalidation
- Menu cache: 5 minutes (menus change infrequently)

**Client-Side:**
- localStorage cache for menus (5 minutes)
- Session-based caching
- Background refresh for stale data

### 2. Query Optimization

- Selective field loading (only required fields)
- Indexed database queries
- Pagination for large result sets
- Debounced search requests

### 3. Search Optimization

- Quick search mode for autocomplete (limited fields)
- Relevance-based sorting
- Result highlighting (limited to 3 snippets)
- Execution time tracking

## Usage Examples

### Server Component (Layout)

```typescript
// app/(root)/layout.tsx
import { getCachedPublicMenusTree } from '@/services/menu.service';

export default async function HomeLayout({ children }) {
  const menus = await getCachedPublicMenusTree();
  return <Navbar menus={menus} />;
}
```

### Client Component (Search)

```typescript
// SearchBar automatically handles:
// - Debounced API calls
// - Autocomplete suggestions
// - Navigation
<SearchBar variant="desktop" />
```

### API Usage

```typescript
// Quick search for autocomplete
const response = await fetch('/api/news/search?q=cricket&quick=true&limit=5');
const { data } = await response.json();

// Full search with filters
const response = await fetch(
  '/api/news/search?q=india&category=sport&sortBy=relevance&page=1&limit=10'
);
const { data } = await response.json();
```

## Benefits

1. **Fast Menu Loading**: Server-side rendering eliminates API delay
2. **Instant Search**: Debounced autocomplete with quick results
3. **Smart Caching**: Multi-layer caching for optimal performance
4. **Better UX**: No loading spinners, instant navigation
5. **Scalable**: Optimized queries handle large datasets
6. **SEO Friendly**: Server-side rendering for better SEO

## Future Enhancements

- [ ] Search analytics tracking
- [ ] Popular search suggestions
- [ ] Search history
- [ ] Advanced filters UI
- [ ] Search result ranking improvements
- [ ] Full-text search with PostgreSQL (if needed)

