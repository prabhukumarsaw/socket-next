# News Platform API Documentation

## Overview

This document describes the advanced News Platform APIs designed for fast, optimized, and scalable news delivery. All APIs are optimized for both client and server-side rendering with intelligent caching.

## Architecture

- **Service Layer**: `lib/services/news-api.service.ts` - Business logic and data access
- **API Routes**: `app/api/news/*` - RESTful endpoints
- **Caching**: Next.js `unstable_cache` with tag-based invalidation
- **Performance**: Optimized queries with selective field loading

## Base URL

```
/api/news
```

## Authentication

All endpoints are **public** and do not require authentication.

## Response Format

All APIs return a consistent response format:

```json
{
  "success": boolean,
  "data": any,
  "meta"?: {
    "count"?: number,
    "timestamp": string,
    ...
  },
  "pagination"?: {
    "page": number,
    "limit": number,
    "total": number,
    "totalPages": number,
    "hasNext": boolean,
    "hasPrev": boolean
  }
}
```

## Endpoints

### 1. Featured News

Get featured news articles.

**Endpoint:** `GET /api/news/featured`

**Query Parameters:**
- `limit` (optional): Number of results (default: 10, max: 50)
- `includeContent` (optional): Include full content (default: false)

**Example Request:**
```bash
GET /api/news/featured?limit=5&includeContent=false
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "title": "Featured News Title",
      "slug": "featured-news-title",
      "excerpt": "News excerpt...",
      "coverImage": "https://...",
      "isBreaking": false,
      "isFeatured": true,
      "viewCount": 1234,
      "likes": 56,
      "publishedAt": "2024-01-15T10:00:00Z",
      "author": {
        "id": "clx...",
        "username": "author1",
        "firstName": "John",
        "lastName": "Doe"
      },
      "categories": [...]
    }
  ],
  "meta": {
    "count": 5,
    "timestamp": "2024-01-15T12:00:00Z"
  }
}
```

---

### 2. Breaking News

Get breaking news articles.

**Endpoint:** `GET /api/news/breaking`

**Query Parameters:**
- `limit` (optional): Number of results (default: 5, max: 20)
- `includeContent` (optional): Include full content (default: false)

**Example Request:**
```bash
GET /api/news/breaking?limit=3
```

---

### 3. Most Viewed News

Get most viewed news articles.

**Endpoint:** `GET /api/news/most-viewed`

**Query Parameters:**
- `limit` (optional): Number of results (default: 10, max: 50)
- `days` (optional): Number of days to look back (default: 30, max: 365)
- `includeContent` (optional): Include full content (default: false)

**Example Request:**
```bash
GET /api/news/most-viewed?limit=10&days=7
```

---

### 4. Today's Recent News

Get news articles published today.

**Endpoint:** `GET /api/news/recent`

**Query Parameters:**
- `limit` (optional): Number of results (default: 20, max: 100)
- `includeContent` (optional): Include full content (default: false)

**Example Request:**
```bash
GET /api/news/recent?limit=20
```

---

### 5. Author-wise News

Get all news articles by a specific author.

**Endpoint:** `GET /api/news/author/[authorId]`

**Path Parameters:**
- `authorId`: Author's user ID

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 10, max: 50)
- `includeContent` (optional): Include full content (default: false)

**Example Request:**
```bash
GET /api/news/author/clx123?page=1&limit=10
```

**Example Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  },
  "meta": {
    "author": {
      "id": "clx123",
      "username": "author1",
      "name": "John Doe"
    },
    "timestamp": "2024-01-15T12:00:00Z"
  }
}
```

---

### 6. Category-wise News

Get news articles filtered by category. Handles complex category logic including:
- Single category
- Parent categories (includes children)
- State-wise categories (Delhi, Kolkata, Bangalore, etc.)
- Nested categories

**Endpoint:** `GET /api/news/category/[slug]`

**Path Parameters:**
- `slug`: Category slug

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 10, max: 50)
- `includeChildren` (optional): Include child categories (default: false)
- `includeContent` (optional): Include full content (default: false)

**Example Requests:**

Single category:
```bash
GET /api/news/category/sport
```

Parent category with children:
```bash
GET /api/news/category/sport?includeChildren=true
```

State-wise category:
```bash
GET /api/news/category/delhi
```

**Example Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  },
  "meta": {
    "category": {
      "id": "clx...",
      "name": "Sport",
      "slug": "sport",
      "parentId": null,
      "parent": null,
      "children": [...],
      "newsCount": 25
    },
    "includeChildren": false,
    "timestamp": "2024-01-15T12:00:00Z"
  }
}
```

---

### 7. Public Categories

Get all public categories with news counts.

**Endpoint:** `GET /api/news/categories`

**Example Request:**
```bash
GET /api/news/categories
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "name": "Sport",
      "slug": "sport",
      "path": "/sport",
      "icon": "sport-icon",
      "parentId": null,
      "order": 1,
      "newsCount": 150,
      "children": [
        {
          "id": "clx...",
          "name": "Cricket",
          "slug": "cricket",
          "newsCount": 50
        }
      ]
    },
    {
      "id": "clx...",
      "name": "Delhi",
      "slug": "delhi",
      "newsCount": 75,
      "children": []
    }
  ],
  "meta": {
    "count": 10,
    "timestamp": "2024-01-15T12:00:00Z"
  }
}
```

## Category Logic

The category system supports:

1. **Parent Categories**: Categories like "Sport", "Business", "Technology"
2. **Child Categories**: Subcategories like "Cricket" under "Sport"
3. **State-wise Categories**: Location-based categories like "Delhi", "Kolkata", "Bangalore"
4. **Nested Structure**: Categories can have multiple levels of nesting

When `includeChildren=true`, the API returns news from both the category and all its children.

## Caching

All APIs use intelligent caching:

- **Cache Duration**: 60 seconds (categories: 5 minutes)
- **Stale-while-revalidate**: 120 seconds
- **Tag-based Invalidation**: Cache tags for selective invalidation

Cache headers are automatically set:
```
Cache-Control: public, s-maxage=60, stale-while-revalidate=120
```

## Performance Optimizations

1. **Selective Field Loading**: Only loads required fields
2. **Database Indexing**: Optimized queries with proper indexes
3. **Pagination**: Efficient pagination for large datasets
4. **Query Optimization**: Minimal database queries
5. **Response Compression**: Automatic compression via Next.js

## Error Handling

All APIs return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed error message"
}
```

**HTTP Status Codes:**
- `200`: Success
- `404`: Resource not found
- `500`: Server error

## Usage Examples

### React/Next.js Client Component

```typescript
// Fetch featured news
const response = await fetch('/api/news/featured?limit=5');
const { success, data } = await response.json();

// Fetch category news with pagination
const response = await fetch('/api/news/category/sport?page=1&limit=10');
const { success, data, pagination } = await response.json();
```

### Server Component (Next.js)

```typescript
import { getCachedFeaturedNews } from '@/lib/services/news-api.service';

export default async function FeaturedNews() {
  const news = await getCachedFeaturedNews({ limit: 5 });
  return <NewsList news={news} />;
}
```

## Best Practices

1. **Use Pagination**: Always use pagination for large datasets
2. **Limit Content**: Only request `includeContent=true` when needed
3. **Cache on Client**: Implement client-side caching for frequently accessed data
4. **Error Handling**: Always handle errors gracefully
5. **Loading States**: Show loading states while fetching data

## Rate Limiting

Currently, there are no rate limits. However, consider implementing rate limiting for production use.

## Future Enhancements

- [ ] Search API
- [ ] Filter by date range
- [ ] Sort options (date, views, likes)
- [ ] Related news API
- [ ] News recommendations
- [ ] Analytics endpoints

