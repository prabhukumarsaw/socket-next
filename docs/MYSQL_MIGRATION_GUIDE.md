# MySQL to PostgreSQL Migration Guide

This guide explains how to migrate news data from your Laravel MySQL database to the Next.js PostgreSQL database.

## Overview

The migration script (`scripts/migrate-mysql-to-postgres.ts`) transfers news posts from MySQL to PostgreSQL with proper field mapping and data transformation.

## Field Mapping

| MySQL Field (posts table) | PostgreSQL Field (news table) | Notes |
|---------------------------|-------------------------------|-------|
| `post_title` | `title` | Cleaned and validated |
| `post_name` | `slug` | Generated from title if empty |
| `post_summary` | `excerpt` | Generated from content if empty |
| `post_content` | `content` | Converted to Lexical JSON format |
| `post_image` | `coverImage` | Full URL constructed from image name |
| `post_hits` | `viewCount` | View count transferred |
| `like` | `likes` | Like count transferred |
| `post_status` | `isPublished`, `isActive` | Boolean flags |
| `created_at` | `createdAt` | Date validated |
| `updated_at` | `updatedAt` | Date validated |
| `post_author` | `authorId` | Uses default author (see below) |

## Prerequisites

1. **MySQL Database Access**: You need access to your Laravel MySQL database
2. **PostgreSQL Database**: Your Next.js PostgreSQL database should be set up and running
3. **Node.js Dependencies**: Install MySQL2 client

## Setup Instructions

### 1. Install MySQL2 Dependency

```bash
npm install mysql2
```

### 2. Configure Environment Variables

Add the following to your `.env` file:

```env
# MySQL Database Connection (Laravel)
MYSQL_DATABASE_URL=mysql://username:password@host:port/database_name

# Example:
# MYSQL_DATABASE_URL=mysql://root:password123@localhost:3306/laravel_db

# Image Base URL (optional - defaults to bawalnews.com)
# This is used to construct full image URLs from image names
MYSQL_IMAGE_BASE_URL=https://www.bawalnews.com/storage/images/

# PostgreSQL Database Connection (already configured)
DATABASE_URL=postgresql://user:password@localhost:5432/nextjs_db
```

### 3. Update Image Base URL

In `scripts/migrate-mysql-to-postgres.ts`, update the `BASE_IMAGE_URL` constant to match your Laravel storage path:

```typescript
const BASE_IMAGE_URL = process.env.MYSQL_IMAGE_BASE_URL || 'https://www.yoursite.com/storage/images/';
```

Or set it via environment variable as shown above.

### 4. Verify Default Author

The script will automatically create a default author if one doesn't exist:
- **Email**: `admin@bawalnews.com`
- **Username**: `admin`

If you want to use a different author, update the `ensureDefaultAuthor()` function in the migration script.

## Running the Migration

### Basic Migration

```bash
npm run migrate:mysql
```

This will:
1. Connect to your MySQL database
2. Fetch all published posts
3. Transform and migrate them to PostgreSQL
4. Skip duplicates and invalid entries
5. Show progress and statistics

### Migration Process

The script processes posts in batches of 50 to avoid overwhelming the database. You'll see:
- Connection status
- Progress updates every 10 posts
- Final statistics report

### Expected Output

```
🚀 Starting MySQL to PostgreSQL Migration

📡 Connecting to MySQL: localhost:3306/laravel_db
✅ Connected to MySQL

👤 Ensuring default author exists...
✅ Default author ID: clx1234567890

📥 Fetching posts from MySQL...
✅ Found 150 posts in MySQL

🔄 Starting migration of 150 posts...

📦 Processing batch 1/3...
✅ [1] Migrated: First News Post Title
✅ [10] Migrated: Another News Post Title
...

============================================================
🎉 MIGRATION COMPLETED!
============================================================
✅ Successfully migrated: 145 posts
⏭️  Skipped (duplicates/invalid): 3 posts
❌ Errors: 2 posts
📊 Total processed: 150 posts
============================================================
```

## Data Transformation Details

### Content Conversion

The script converts HTML content from MySQL to Lexical JSON format (used by the Next.js editor):

- HTML tags are removed
- Content is split into paragraphs
- Each paragraph becomes a Lexical paragraph node
- Empty content gets a minimal Lexical structure

### Image URL Construction

Image names from MySQL are converted to full URLs:
- If image name is already a full URL, it's used as-is
- Otherwise, base URL is prepended to the image name
- Example: `image.jpg` → `https://www.bawalnews.com/storage/images/image.jpg`

### Slug Generation

- Uses existing `post_name` if valid
- Otherwise generates slug from title
- Ensures uniqueness by appending numbers if needed

### Date Validation

- Only accepts dates from 2020 onwards
- Invalid dates default to current date
- Preserves original creation/update times when valid

## Handling Categories

**Note**: The current migration script doesn't handle categories automatically. Categories are linked via the `NewsCategory` junction table.

To assign categories after migration:

1. Identify categories in your MySQL database
2. Map them to existing Menu items in PostgreSQL
3. Create `NewsCategory` entries manually or via script

Example:

```typescript
// After migration, assign categories
await prisma.newsCategory.create({
  data: {
    newsId: migratedNewsId,
    menuId: categoryMenuId
  }
});
```

## Troubleshooting

### Connection Errors

**Error**: `MYSQL_DATABASE_URL environment variable is required`

**Solution**: Add `MYSQL_DATABASE_URL` to your `.env` file.

**Error**: `Invalid MYSQL_DATABASE_URL format`

**Solution**: Use format: `mysql://user:password@host:port/database`

### Duplicate Slugs

The script automatically handles duplicate slugs by appending numbers:
- `my-post`
- `my-post-1`
- `my-post-2`
- etc.

### Missing Images

If images don't appear after migration:
1. Verify `MYSQL_IMAGE_BASE_URL` is correct
2. Check that image files are accessible at the URL
3. Update the base URL in the script or environment variable

### Content Format Issues

If content doesn't display properly:
1. Check the Lexical JSON structure in the database
2. The script converts HTML to plain text paragraphs
3. For complex HTML, you may need to enhance the conversion function

## Post-Migration Steps

1. **Verify Data**: Check a few migrated posts in the Next.js app
2. **Update Categories**: Assign categories to migrated posts
3. **Check Images**: Verify all images are loading correctly
4. **Test Functionality**: Ensure all features work with migrated data
5. **Backup**: Keep a backup of both databases

## Performance Considerations

- Migration processes 50 posts per batch
- Large databases may take time - be patient
- Monitor PostgreSQL connection pool if migrating thousands of posts
- Consider running during low-traffic periods

## Limitations

1. **Categories**: Not automatically migrated - needs manual assignment
2. **Comments**: Comment data is not migrated
3. **Media**: Only image URLs are migrated, not actual files
4. **Authors**: All posts are assigned to the default author
5. **SEO**: Meta keywords are not migrated

## Advanced Customization

### Custom Author Mapping

To map MySQL author IDs to PostgreSQL user IDs, modify the `migratePost` function:

```typescript
// Create author mapping
const authorMap: Record<number, string> = {
  1: 'postgres-user-id-1',
  2: 'postgres-user-id-2',
  // ...
};

// In migratePost function
const authorId = authorMap[post.post_author] || defaultAuthorId;
```

### Custom Content Processing

To enhance HTML-to-Lexical conversion, modify `convertContentToLexical`:

```typescript
// Add support for headings, lists, links, etc.
// See Lexical documentation for node types
```

## Support

If you encounter issues:
1. Check the console output for specific error messages
2. Verify database connections
3. Review the migration statistics
4. Check PostgreSQL logs for database errors

## Rollback

To rollback migrated data:

```sql
-- Delete all migrated news (be careful!)
DELETE FROM news_categories;
DELETE FROM news_views;
DELETE FROM news WHERE "createdAt" > '2024-01-01'; -- Adjust date as needed
```

**Warning**: Always backup your database before running migrations or rollbacks!

