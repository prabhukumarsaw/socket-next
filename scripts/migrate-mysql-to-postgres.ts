/**
 * MySQL to PostgreSQL Migration Script
 * 
 * Migrates news data from MySQL (Laravel) posts table to PostgreSQL (Next.js) news table
 * 
 * Usage:
 * 1. Set MYSQL_DATABASE_URL in .env file
 * 2. Ensure default author exists in PostgreSQL
 * 3. Run: npm run migrate:mysql
 * 
 * Field Mapping:
 * - post_title → title
 * - post_name → slug (or generate from title)
 * - post_summary → excerpt
 * - post_content → content (convert to Lexical JSON if needed)
 * - post_image → coverImage (construct full URL)
 */

import { PrismaClient } from '@prisma/client';
import mysql, { Connection, RowDataPacket } from 'mysql2/promise';

const prisma = new PrismaClient();

const DEFAULT_NEWS_IMAGE =
  process.env.DEFAULT_NEWS_IMAGE ||
  'https://cdn.bawalnews.com/static/images/news-placeholder.jpg';
const MYSQL_IMAGE_BASE_URL = (
  process.env.MYSQL_IMAGE_BASE_URL || 'https://www.bawalnews.com/storage/images/'
).replace(/\/+$/, '');

// Configuration
interface MySQLConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

// MySQL connection type
type MySQLConnection = Connection;

interface MySQLPost {
  id: number;
  post_title: string;
  post_name: string;
  post_summary: string | null;
  post_content: string;
  post_image: string | null;
  post_status: string;
  post_visibility: string;
  post_author: number;
  post_hits: number;
  like: number;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate a URL-safe slug from a string
 */
function generateSlug(text: string): string {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, 200); // Limit length
}

/**
 * Clean and validate title
 */
function cleanTitle(title: string | null | undefined): string {
  if (!title) return 'Untitled News';
  
  return title
    .replace(/<[^>]*>/g, ' ') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .substring(0, 500); // Limit length
}

/**
 * Clean and validate excerpt/summary
 */
function cleanExcerpt(summary: string | null | undefined, content: string): string {
  if (summary && summary.trim() && summary.length >= 50) {
    return summary
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 500);
  }
  
  // Generate excerpt from content
  if (content) {
    const plainText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return plainText.substring(0, 300) + (plainText.length > 300 ? '...' : '');
  }
  
  return '';
}

/**
 * Convert HTML content to Lexical JSON format
 * For now, we'll store as plain text wrapped in Lexical structure
 */
function convertContentToLexical(htmlContent: string | null | undefined): string {
  if (!htmlContent) {
    // Return minimal Lexical JSON structure
    return JSON.stringify({
      root: {
        children: [
          {
            children: [{ detail: 0, format: 0, mode: 'normal', style: '', text: '', type: 'text', version: 1 }],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'paragraph',
            version: 1
          }
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'root',
        version: 1
      }
    });
  }

  // Extract plain text from HTML
  const plainText = htmlContent
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove scripts
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove styles
    .replace(/<[^>]*>/g, '\n') // Replace HTML tags with newlines
    .replace(/\n\s*\n/g, '\n') // Remove multiple newlines
    .trim();

  // Split into paragraphs
  const paragraphs = plainText.split('\n').filter(p => p.trim().length > 0);

  // Convert to Lexical format
  const lexicalNodes = paragraphs.map(text => ({
    children: [
      {
        detail: 0,
        format: 0,
        mode: 'normal',
        style: '',
        text: text.trim(),
        type: 'text',
        version: 1
      }
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    type: 'paragraph',
    version: 1
  }));

  // If no content, add empty paragraph
  if (lexicalNodes.length === 0) {
    lexicalNodes.push({
      children: [
        {
          detail: 0,
          format: 0,
          mode: 'normal',
          style: '',
          text: '',
          type: 'text',
          version: 1
        }
      ],
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'paragraph',
      version: 1
    });
  }

  return JSON.stringify({
    root: {
      children: lexicalNodes,
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1
    }
  });
}

/**
 * Construct image URL from image name with automatic fallback to default image
 */
function constructImageUrl(imageName: string | null | undefined): string {
  if (!imageName || imageName.trim() === '') {
    return DEFAULT_NEWS_IMAGE;
  }

  const cleaned = imageName.trim();

  // Check if it's already a full URL
  if (/^https?:\/\//i.test(cleaned)) {
    return cleaned;
  }

  // Remove leading slash if present
  const path = cleaned.startsWith('/') ? cleaned.substring(1) : cleaned;

  return `${MYSQL_IMAGE_BASE_URL}/${path}`;
}

/**
 * Validate and clean date
 */
function cleanDate(date: Date | string | null | undefined): Date {
  if (!date) return new Date();

  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return new Date();
    
    // Only accept dates from 2020 onwards
    const minDate = new Date('2020-01-01');
    return dateObj >= minDate ? dateObj : new Date();
  } catch {
    return new Date();
  }
}

/**
 * Ensure default author exists in PostgreSQL
 */
async function ensureDefaultAuthor(): Promise<string> {
  // Try to find an existing admin user
  const adminUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: 'admin@bawalnews.com' },
        { username: 'admin' }
      ]
    }
  });

  if (adminUser) {
    return adminUser.id;
  }

  // Create a default admin user if none exists
  const defaultUser = await prisma.user.create({
    data: {
      email: 'admin@bawalnews.com',
      username: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      password: '$2a$10$dummy.hash.for.migration.user', // Dummy password
      isActive: true,
      provider: 'credentials'
    }
  });

  return defaultUser.id;
}

// ============================================================================
// MIGRATION FUNCTIONS
// ============================================================================

/**
 * Parse MySQL connection string from environment variable
 */
function parseMySQLConfig(): MySQLConfig {
  const mysqlUrl = process.env.MYSQL_DATABASE_URL;
  
  if (!mysqlUrl) {
    throw new Error('MYSQL_DATABASE_URL environment variable is required');
  }

  // Parse connection string format: mysql://user:password@host:port/database
  const urlPattern = /^mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/;
  const match = mysqlUrl.match(urlPattern);

  if (!match) {
    throw new Error('Invalid MYSQL_DATABASE_URL format. Expected: mysql://user:password@host:port/database');
  }

  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: parseInt(match[4]),
    database: match[5]
  };
}

/**
 * Fetch posts from MySQL database
 */
async function fetchMySQLPosts(connection: Connection, limit?: number): Promise<MySQLPost[]> {
  console.log('📥 Fetching posts from MySQL...');

  const limitClause = limit ? `LIMIT ${limit}` : '';
  
  const [rows] = await connection.execute<RowDataPacket[]>(`
    SELECT 
      id,
      post_title,
      post_name,
      post_summary,
      post_content,
      post_image,
      post_status,
      post_visibility,
      post_author,
      post_hits,
      \`like\`,
      created_at,
      updated_at
    FROM posts
    WHERE post_status = 'publish'
      AND post_type = 'post'
      AND post_visibility = 'public'
    ORDER BY created_at DESC
    ${limitClause}
  `);

  console.log(`✅ Found ${rows.length} posts in MySQL`);
  return rows as unknown as MySQLPost[];
}

/**
 * Check if news already exists in PostgreSQL
 */
async function newsExists(slug: string, title: string): Promise<boolean> {
  const existing = await prisma.news.findFirst({
    where: {
      OR: [
        { slug },
        { title }
      ]
    }
  });

  return !!existing;
}

/**
 * Migrate a single post from MySQL to PostgreSQL
 */
async function migratePost(
  post: MySQLPost,
  defaultAuthorId: string,
  stats: { success: number; skipped: number; errors: number }
): Promise<void> {
  try {
    // Clean and validate data
    const title = cleanTitle(post.post_title);
    if (!title || title === 'Untitled News') {
      stats.skipped++;
      return;
    }

    // Generate or use existing slug
    let slug = post.post_name ? generateSlug(post.post_name) : generateSlug(title);
    if (!slug) {
      slug = generateSlug(title);
    }

    // Ensure slug is unique
    let uniqueSlug = slug;
    let counter = 1;
    while (await newsExists(uniqueSlug, title)) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    // Check for duplicate by title
    if (await newsExists('', title)) {
      stats.skipped++;
      return;
    }

    // Clean excerpt
    const excerpt = cleanExcerpt(post.post_summary, post.post_content);
    
    // Convert content to Lexical format
    const content = convertContentToLexical(post.post_content);
    
    // Construct image URL
    const coverImage = constructImageUrl(post.post_image);
    
    // Clean dates
    const createdAt = cleanDate(post.created_at);
    const updatedAt = cleanDate(post.updated_at);
    const publishedAt = post.post_status === 'publish' ? createdAt : null;

    // Create news in PostgreSQL
    await prisma.news.create({
      data: {
        title,
        slug: uniqueSlug,
        excerpt: excerpt || undefined,
        content,
        coverImage,
        isPublished: post.post_status === 'publish',
        isActive: post.post_status === 'publish',
        isBreaking: false,
        isFeatured: false,
        viewCount: post.post_hits || 0,
        likes: post.like || 0,
        authorId: defaultAuthorId,
        publishedAt,
        createdAt,
        updatedAt,
        // SEO fields - generate from existing data
        metaTitle: title.substring(0, 60),
        metaDescription: excerpt.substring(0, 160) || undefined,
        metaKeywords: undefined,
      }
    });

    stats.success++;
    
    if (stats.success % 10 === 0 || stats.success <= 5) {
      console.log(`✅ [${stats.success}] Migrated: ${title.substring(0, 60)}`);
    }
  } catch (error: any) {
    stats.errors++;
    console.error(`❌ Error migrating post ID ${post.id}: ${error.message}`);
  }
}

/**
 * Main migration function
 */
async function migrateMySQLToPostgreSQL() {
  let mysqlConnection: Connection | null = null;

  try {
    console.log('🚀 Starting MySQL to PostgreSQL Migration\n');

    // Parse MySQL configuration
    const mysqlConfig = parseMySQLConfig();
    console.log(`📡 Connecting to MySQL: ${mysqlConfig.host}:${mysqlConfig.port}/${mysqlConfig.database}`);

    // Connect to MySQL
    mysqlConnection = await mysql.createConnection({
      host: mysqlConfig.host,
      port: mysqlConfig.port,
      user: mysqlConfig.user,
      password: mysqlConfig.password,
      database: mysqlConfig.database,
    });

    console.log('✅ Connected to MySQL\n');

    // Ensure default author exists
    console.log('👤 Ensuring default author exists...');
    const defaultAuthorId = await ensureDefaultAuthor();
    console.log(`✅ Default author ID: ${defaultAuthorId}\n`);

    // Fetch posts from MySQL
    const posts = await fetchMySQLPosts(mysqlConnection);
    
    if (posts.length === 0) {
      console.log('⚠️  No posts found in MySQL database');
      return;
    }

    console.log(`\n🔄 Starting migration of ${posts.length} posts...\n`);

    // Migration statistics
    const stats = {
      success: 0,
      skipped: 0,
      errors: 0
    };

    // Process posts in batches to avoid overwhelming the database
    const BATCH_SIZE = 50;
    for (let i = 0; i < posts.length; i += BATCH_SIZE) {
      const batch = posts.slice(i, i + BATCH_SIZE);
      console.log(`\n📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(posts.length / BATCH_SIZE)}...`);

      // Process batch in parallel (limited concurrency)
      const batchPromises = batch.map(post => migratePost(post, defaultAuthorId, stats));
      await Promise.all(batchPromises);

      // Small delay between batches
      if (i + BATCH_SIZE < posts.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Final report
    console.log('\n' + '='.repeat(60));
    console.log('🎉 MIGRATION COMPLETED!');
    console.log('='.repeat(60));
    console.log(`✅ Successfully migrated: ${stats.success} posts`);
    console.log(`⏭️  Skipped (duplicates/invalid): ${stats.skipped} posts`);
    console.log(`❌ Errors: ${stats.errors} posts`);
    console.log(`📊 Total processed: ${posts.length} posts`);
    console.log('='.repeat(60));

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    // Close connections
    if (mysqlConnection) {
      await mysqlConnection.end();
      console.log('\n🔌 MySQL connection closed');
    }
    await prisma.$disconnect();
    console.log('🔌 PostgreSQL connection closed');
  }
}

// Run migration
if (require.main === module) {
  migrateMySQLToPostgreSQL()
    .then(() => {
      console.log('\n✨ Migration script finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Fatal error:', error);
      process.exit(1);
    });
}

export default migrateMySQLToPostgreSQL;

