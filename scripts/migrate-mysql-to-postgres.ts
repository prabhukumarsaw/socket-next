/**
 * MySQL to PostgreSQL Migration Script
 * 
 * Migrates news data from MySQL (Laravel) posts table to PostgreSQL (Next.js) news table
 * 
 * Usage:
 * 1. Set MYSQL_DATABASE_URL in .env file
 * 2. Set MYSQL_IMAGE_BASE_URL (optional, for HTTP/HTTPS images)
 * 3. Set MYSQL_IMAGE_LOCAL_PATH (optional, for local file system - faster)
 * 4. Ensure default author exists in PostgreSQL
 * 5. Run: npm run migrate:mysql
 * 
 * Field Mapping:
 * - post_title → title
 * - post_name → slug (or generate from title)
 * - post_summary → excerpt
 * - post_content → content (convert to Lexical JSON if needed)
 * - post_image → coverImage (download and save to local storage)
 * 
 * Image Migration:
 * - Images are downloaded from old system and saved to /storage/media/migrated/
 * - Set MYSQL_IMAGE_BASE_URL for HTTP/HTTPS image URLs (e.g., http://old-site.com/storage/images/)
 * - Set MYSQL_IMAGE_LOCAL_PATH for local file system path (e.g., /var/www/old-site/storage/images/)
 * - Images are optimized and compressed during migration
 * - Failed images will use DEFAULT_NEWS_IMAGE
 */

import { PrismaClient } from '@prisma/client';
import mysql, { Connection, RowDataPacket } from 'mysql2/promise';
import { uploadToLocalStorage, sanitizeFilename, generateUniqueFilename } from '../lib/storage/local-storage';
import path from 'path';
import fs from 'fs/promises';
import https from 'https';
import http from 'http';

const prisma = new PrismaClient();

const DEFAULT_NEWS_IMAGE =
  process.env.DEFAULT_NEWS_IMAGE ||
  '/storage/media/uploads/default-news.jpg';
const MYSQL_IMAGE_BASE_URL = (
  process.env.MYSQL_IMAGE_BASE_URL || 'http://localhost:3000/storage/images/'
).replace(/\/+$/, '');

// Local file path for images (if migrating from local filesystem)
const MYSQL_IMAGE_LOCAL_PATH = process.env.MYSQL_IMAGE_LOCAL_PATH || '';

// Local storage path for migrated images
const MIGRATED_IMAGES_FOLDER = 'migrated';

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
 * Download image from URL and return as Buffer
 */
async function downloadImage(url: string, timeout: number = 10000): Promise<Buffer | null> {
  return new Promise((resolve) => {
    try {
      const protocol = url.startsWith('https') ? https : http;
      
      const request = protocol.get(url, {
        timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; MigrationBot/1.0)',
        },
      }, (response) => {
        // Handle redirects
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            return resolve(downloadImage(redirectUrl, timeout));
          }
        }

        if (response.statusCode !== 200) {
          return resolve(null);
        }

        const chunks: Buffer[] = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => {
          resolve(Buffer.concat(chunks));
        });
      });

      request.on('error', () => resolve(null));
      request.on('timeout', () => {
        request.destroy();
        resolve(null);
      });
    } catch {
      resolve(null);
    }
  });
}

/**
 * Read image from local file system (if MYSQL_IMAGE_LOCAL_PATH is set)
 */
async function readImageFromLocal(imagePath: string): Promise<Buffer | null> {
  if (!MYSQL_IMAGE_LOCAL_PATH) {
    return null;
  }

  try {
    // Construct full path
    const fullPath = path.join(MYSQL_IMAGE_LOCAL_PATH, imagePath);
    
    // Security: Ensure path is within the allowed directory
    const normalizedPath = path.normalize(fullPath);
    const normalizedBase = path.normalize(MYSQL_IMAGE_LOCAL_PATH);
    
    if (!normalizedPath.startsWith(normalizedBase)) {
      console.log(`  ⚠️  Path traversal detected: ${imagePath}`);
      return null;
    }

    // Check if file exists
    const stats = await fs.stat(normalizedPath);
    if (!stats.isFile()) {
      return null;
    }

    // Read file
    const buffer = await fs.readFile(normalizedPath);
    return buffer;
  } catch (error: any) {
    // File doesn't exist or can't be read
    return null;
  }
}

/**
 * Migrate image from old system to local storage
 * Downloads the image and saves it locally, returns the new relative URL
 */
async function migrateImage(
  imageName: string | null | undefined,
  postId: number
): Promise<string> {
  // If no image name, return default
  if (!imageName || imageName.trim() === '') {
    return DEFAULT_NEWS_IMAGE;
  }

  const cleaned = imageName.trim();

  // If it's already a local path (starts with /storage/), return as is
  if (cleaned.startsWith('/storage/')) {
    return cleaned;
  }

  let imageBuffer: Buffer | null = null;

  // Try to read from local file system first (if MYSQL_IMAGE_LOCAL_PATH is set)
  if (MYSQL_IMAGE_LOCAL_PATH) {
    const localPath = cleaned.startsWith('/') ? cleaned.substring(1) : cleaned;
    imageBuffer = await readImageFromLocal(localPath);
    
    if (imageBuffer) {
      console.log(`  📁 Found image in local path: ${cleaned.substring(0, 60)}...`);
    }
  }

  // If not found locally, try to download from URL
  if (!imageBuffer) {
    // Construct source URL
    let sourceUrl: string;
    if (/^https?:\/\//i.test(cleaned)) {
      sourceUrl = cleaned;
    } else {
      const imagePath = cleaned.startsWith('/') ? cleaned.substring(1) : cleaned;
      sourceUrl = `${MYSQL_IMAGE_BASE_URL}/${imagePath}`;
    }

    try {
      console.log(`  📥 Downloading image: ${sourceUrl.substring(0, 80)}...`);
      imageBuffer = await downloadImage(sourceUrl);
    } catch (error: any) {
      console.log(`  ⚠️  Download failed: ${error.message}`);
    }
  }

  // If still no image, use default
  if (!imageBuffer || imageBuffer.length === 0) {
    console.log(`  ⚠️  Image not found, using default`);
    return DEFAULT_NEWS_IMAGE;
  }

  // Validate it's actually an image (check magic bytes)
  const isValidImage = 
    (imageBuffer[0] === 0xFF && imageBuffer[1] === 0xD8 && imageBuffer[2] === 0xFF) || // JPEG
    (imageBuffer[0] === 0x89 && imageBuffer[1] === 0x50 && imageBuffer[2] === 0x4E && imageBuffer[3] === 0x47) || // PNG
    (imageBuffer[0] === 0x47 && imageBuffer[1] === 0x49 && imageBuffer[2] === 0x46) || // GIF
    (imageBuffer[0] === 0x52 && imageBuffer[1] === 0x49 && imageBuffer[2] === 0x46 && imageBuffer[3] === 0x46); // WebP

  if (!isValidImage) {
    console.log(`  ⚠️  Invalid image format, using default`);
    return DEFAULT_NEWS_IMAGE;
  }

  try {
    // Generate filename from original image name
    const originalFilename = path.basename(cleaned);
    const sanitized = sanitizeFilename(originalFilename);
    
    // Use generateUniqueFilename to ensure uniqueness
    const uniqueFilename = generateUniqueFilename(sanitized);

    // Upload to local storage
    const result = await uploadToLocalStorage(
      imageBuffer,
      originalFilename,
      {
        folder: MIGRATED_IMAGES_FOLDER,
        quality: 85,
        maxWidth: 1920,
        maxHeight: 1080,
        generateBlur: false, // Skip blur for migration to speed up
      }
    );

    console.log(`  ✅ Image migrated: ${result.url}`);
    return result.url;

  } catch (error: any) {
    console.log(`  ⚠️  Error saving image: ${error.message}, using default`);
    return DEFAULT_NEWS_IMAGE;
  }
}

/**
 * Construct image URL from image name (legacy function, now uses migrateImage)
 * @deprecated Use migrateImage instead
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
  const imagePath = cleaned.startsWith('/') ? cleaned.substring(1) : cleaned;

  return `${MYSQL_IMAGE_BASE_URL}/${imagePath}`;
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
  stats: { success: number; skipped: number; errors: number; imagesMigrated: number; imagesFailed: number }
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
    
    // Migrate image to local storage
    let coverImage = DEFAULT_NEWS_IMAGE;
    if (post.post_image && post.post_image.trim()) {
      try {
        coverImage = await migrateImage(post.post_image, post.id);
        if (coverImage !== DEFAULT_NEWS_IMAGE) {
          stats.imagesMigrated++;
        } else {
          stats.imagesFailed++;
        }
      } catch (error: any) {
        console.log(`  ⚠️  Image migration failed for post ${post.id}: ${error.message}`);
        stats.imagesFailed++;
        // Continue with default image
      }
    }
    
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
      errors: 0,
      imagesMigrated: 0,
      imagesFailed: 0
    };

    // Process posts in batches to avoid overwhelming the database
    const BATCH_SIZE = 20; // Reduced batch size to handle image downloads
    for (let i = 0; i < posts.length; i += BATCH_SIZE) {
      const batch = posts.slice(i, i + BATCH_SIZE);
      console.log(`\n📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(posts.length / BATCH_SIZE)}...`);

      // Process batch sequentially to avoid overwhelming image server
      for (const post of batch) {
        await migratePost(post, defaultAuthorId, stats);
        // Small delay between posts to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Delay between batches
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
    console.log(`🖼️  Images migrated: ${stats.imagesMigrated} images`);
    console.log(`⚠️  Images failed/using default: ${stats.imagesFailed} images`);
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

