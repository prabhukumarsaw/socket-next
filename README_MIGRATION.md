# MySQL to PostgreSQL Migration

This project includes a migration script to transfer news data from Laravel MySQL database to Next.js PostgreSQL database.

## Quick Start

### 1. Install MySQL2 Package

```bash
npm install mysql2
```

### 2. Configure Environment

Add to your `.env` file:

```env
# MySQL Database Connection (Laravel)
MYSQL_DATABASE_URL=mysql://username:password@host:port/database_name

# Image Base URL (optional)
MYSQL_IMAGE_BASE_URL=https://www.bawalnews.com/storage/images/
```

### 3. Run Migration

```bash
npm run migrate:mysql
```

## Field Mapping

The script maps the following fields:

| MySQL (posts) | PostgreSQL (news) |
|---------------|-------------------|
| `post_title` → `title` |
| `post_name` → `slug` |
| `post_summary` → `excerpt` |
| `post_content` → `content` (converted to Lexical JSON) |
| `post_image` → `coverImage` (full URL constructed) |
| `post_hits` → `viewCount` |
| `like` → `likes` |
| `post_status` → `isPublished`, `isActive` |

## Detailed Documentation

See [docs/MYSQL_MIGRATION_GUIDE.md](./docs/MYSQL_MIGRATION_GUIDE.md) for:
- Complete setup instructions
- Configuration options
- Troubleshooting
- Advanced customization
- Post-migration steps

## Important Notes

1. **Default Author**: All migrated posts will be assigned to a default admin user. Update this in the script if needed.
2. **Categories**: Categories are not automatically migrated. You'll need to assign them manually after migration.
3. **Images**: Image URLs are constructed from image names. Make sure `MYSQL_IMAGE_BASE_URL` is correct.
4. **Content**: HTML content is converted to Lexical JSON format for the Next.js editor.

## Requirements

- MySQL database access (read-only is sufficient)
- PostgreSQL database running
- Node.js 18+ 
- npm or yarn

