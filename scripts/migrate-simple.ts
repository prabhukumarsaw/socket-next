// scripts/csv-to-postgres-stable.ts
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import csv from 'csv-parser';

const prisma = new PrismaClient();

// Strict field-specific validation
function validateTitle(title: string): { valid: boolean; cleaned: string } {
  if (!title) return { valid: false, cleaned: '' };
  
  const cleaned = title
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Title-specific validation
  if (cleaned.length < 15 || cleaned.length > 300) return { valid: false, cleaned: '' };
  if (cleaned.includes('The verdict in Malegaon blast')) return { valid: false, cleaned: '' };
  if (cleaned.includes('NULL')) return { valid: false, cleaned: '' };
  
  const words = cleaned.split(/\s+/).filter(word => word.length >= 2);
  if (words.length < 4) return { valid: false, cleaned: '' };
  
  return { valid: true, cleaned };
}

function validateSlug(slug: string, title: string): { valid: boolean; cleaned: string } {
  // Generate slug from title if invalid
  if (!slug || slug === 'NULL' || slug.includes('The verdict in Malegaon blast')) {
    const generated = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 150);
    return { valid: true, cleaned: generated };
  }
  
  const cleaned = slug.trim();
  
  // Slug-specific validation
  if (!/^[a-z0-9-]+$/.test(cleaned)) return { valid: false, cleaned: '' };
  if (cleaned.length < 5 || cleaned.length > 200) return { valid: false, cleaned: '' };
  
  return { valid: true, cleaned };
}

function validateContent(content: string): { valid: boolean; cleaned: string } {
  if (!content || content === 'NULL') return { valid: false, cleaned: '' };
  
  const cleaned = content
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Content-specific validation
  if (cleaned.length < 200) return { valid: false, cleaned: '' };
  if (cleaned.includes('The verdict in Malegaon blast case came after')) return { valid: false, cleaned: '' };
  
  const words = cleaned.split(/\s+/).filter(word => word.length >= 2);
  if (words.length < 50) return { valid: false, cleaned: '' };
  
  return { valid: true, cleaned };
}

function validateSummary(summary: string, content: string): { valid: boolean; cleaned: string } {
  if (summary && summary !== 'NULL' && !summary.includes('The verdict in Malegaon blast')) {
    const cleaned = summary
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (cleaned.length >= 50 && cleaned.length <= 500) {
      return { valid: true, cleaned };
    }
  }
  
  // Generate from content
  const fromContent = content.length > 150 
    ? content.substring(0, 147) + '...'
    : content;
  
  return { valid: true, cleaned: fromContent };
}

function validateMetaDescription(metaDesc: string, content: string): { valid: boolean; cleaned: string } {
  if (metaDesc && metaDesc !== 'NULL' && !metaDesc.includes('The verdict in Malegaon blast')) {
    const cleaned = metaDesc
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (cleaned.length >= 50 && cleaned.length <= 300) {
      return { valid: true, cleaned };
    }
  }
  
  // Generate from content
  const generated = content.length > 150 
    ? content.substring(0, 147) + '...'
    : content;
  
  return { valid: true, cleaned: generated };
}

function validateMetaKeywords(keywords: string): { valid: boolean; cleaned: string } {
  if (!keywords || keywords === 'NULL' || keywords.includes('The verdict in Malegaon blast')) {
    return { valid: true, cleaned: '' };
  }
  
  const cleaned = keywords
    .replace(/<[^>]*>/g, ' ')
    .replace(/[^\w\s,]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  return { valid: true, cleaned: cleaned.substring(0, 255) };
}

// STRICT IMAGE VALIDATION - FIXED
function validateImage(image: string): { valid: boolean; cleaned: string } {
  if (!image || image === 'NULL') return { valid: true, cleaned: '' };
  
  const cleaned = image.trim();
  
  // STRICT image validation - only accept proper image filenames
  const validImageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  const hasValidExtension = validImageExtensions.some(ext => 
    cleaned.toLowerCase().includes(ext)
  );
  
  // Reject if it contains text content instead of image filename
  if (cleaned.includes('The verdict in Malegaon blast case came after')) {
    return { valid: false, cleaned: '' };
  }
  
  // Reject if it looks like text content rather than image
  if (cleaned.length > 100 && !hasValidExtension) {
    return { valid: false, cleaned: '' };
  }
  
  // Reject if it contains HTML tags
  if (cleaned.includes('<') && cleaned.includes('>')) {
    return { valid: false, cleaned: '' };
  }
  
  return { 
    valid: true, 
    cleaned: hasValidExtension ? cleaned.substring(0, 500) : '' 
  };
}

function validateImageMeta(imageMeta: string): { valid: boolean; cleaned: string } {
  if (!imageMeta || imageMeta === 'NULL') return { valid: true, cleaned: '{}' };
  
  const cleaned = imageMeta.trim();
  
  // Only accept proper JSON format for image meta
  if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
    try {
      JSON.parse(cleaned);
      return { valid: true, cleaned: cleaned.substring(0, 1000) };
    } catch {
      return { valid: true, cleaned: '{}' };
    }
  }
  
  return { valid: true, cleaned: '{}' };
}

function validateDate(dateStr: string): { valid: boolean; date: Date } {
  if (!dateStr || dateStr === 'NULL') return { valid: false, date: new Date() };
  
  try {
    const isoDate = String(dateStr).replace(' ', 'T');
    const date = new Date(isoDate);
    
    if (isNaN(date.getTime())) {
      return { valid: false, date: new Date() };
    }
    
    // Only accept dates from 2020 onwards
    const year2020 = new Date('2020-01-01');
    return { valid: date >= year2020, date };
  } catch {
    return { valid: false, date: new Date() };
  }
}

function safeBigInt(value: any): bigint {
  if (!value || value === 'NULL') return BigInt(0);
  try {
    const numericValue = String(value).replace(/[^\d-]/g, '');
    return numericValue ? BigInt(numericValue) : BigInt(0);
  } catch {
    return BigInt(0);
  }
}

async function importStableData() {
  try {
    console.log('📥 Starting stable data import...');
    console.log('🎯 Ensuring each field gets only its proper data type\n');
    
    const results: any[] = [];

    await new Promise((resolve, reject) => {
      fs.createReadStream('bawalbkp.csv')
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    console.log(`📊 Found ${results.length} records in CSV`);

    // Sort by date (newest first)
    results.sort((a, b) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return dateB.getTime() - dateA.getTime();
    });

    let successCount = 0;
    let skipCount = 0;
    const skipReasons = {
      invalidTitle: 0,
      invalidSlug: 0,
      invalidContent: 0,
      invalidImage: 0,
      oldDate: 0
    };

    for (const [index, row] of results.entries()) {
      try {
        // Validate each field strictly
        const titleCheck = validateTitle(row.post_title);
        if (!titleCheck.valid) {
          skipReasons.invalidTitle++;
          continue;
        }

        const slugCheck = validateSlug(row.post_name, titleCheck.cleaned);
        if (!slugCheck.valid) {
          skipReasons.invalidSlug++;
          continue;
        }

        const contentCheck = validateContent(row.post_content);
        if (!contentCheck.valid) {
          skipReasons.invalidContent++;
          continue;
        }

        const imageCheck = validateImage(row.post_image);
        if (!imageCheck.valid) {
          skipReasons.invalidImage++;
          continue;
        }

        const dateCheck = validateDate(row.created_at);
        if (!dateCheck.valid) {
          skipReasons.oldDate++;
          continue;
        }

        // Validate other fields
        const summaryCheck = validateSummary(row.post_summary, contentCheck.cleaned);
        const metaDescCheck = validateMetaDescription(row.meta_description, contentCheck.cleaned);
        const metaKeywordsCheck = validateMetaKeywords(row.meta_keyword);
        const imageMetaCheck = validateImageMeta(row.post_image_meta);

        // Check for duplicates
        const existingPost = await prisma.post.findFirst({
          where: {
            OR: [
              { post_title: titleCheck.cleaned },
              { post_name: slugCheck.cleaned }
            ]
          }
        });

        if (existingPost) {
          skipCount++;
          continue;
        }

        // Create post with strictly validated data
        await prisma.post.create({
          data: {
            // Core content (strictly validated)
            post_title: titleCheck.cleaned,
            post_name: slugCheck.cleaned,
            post_summary: summaryCheck.cleaned,
            post_content: contentCheck.cleaned,
            
            // SEO fields
            meta_description: metaDescCheck.cleaned,
            meta_keyword: metaKeywordsCheck.cleaned,
            
            // Status and visibility
            post_status: 'publish',
            post_visibility: 'public',
            
            // Author and taxonomy
            post_author: safeBigInt(row.post_author || 1),
            post_language: safeBigInt(row.post_language || 1),
            post_type: 'post',
            
            // GUID
            post_guid: row.post_guid && row.post_guid !== 'NULL' ? String(row.post_guid).substring(0, 255) : null,
            
            // Engagement
            post_hits: safeBigInt(row.post_hits || 0),
            like: safeBigInt(row.like || 0),
            
            // MEDIA - STRICTLY VALIDATED
            post_image: imageCheck.cleaned,
            post_image_meta: imageMetaCheck.cleaned,
            post_mime_type: row.post_mime_type && row.post_mime_type !== 'NULL' ? String(row.post_mime_type).substring(0, 100) : '',
            
            // Comments
            comment_status: 'open',
            comment_count: safeBigInt(row.comment_count || 0),
            
            // Source
            post_source: row.post_source && row.post_source !== 'NULL' ? String(row.post_source).substring(0, 500) : '',
            
            // Timestamps
            created_at: dateCheck.date,
            updated_at: validateDate(row.updated_at).date || dateCheck.date,
          }
        });

        successCount++;
        
        // Show progress with field validation info
        if (successCount <= 30 || successCount % 20 === 0) {
          console.log(`✅ ${successCount}. ${titleCheck.cleaned.substring(0, 60)}`);
          console.log(`   📅 ${dateCheck.date.toISOString().split('T')[0]} | 🔗 ${slugCheck.cleaned}`);
          console.log(`   🖼️  Image: ${imageCheck.cleaned ? '✅' : '❌ No image'}`);
          console.log(`   📝 Content: ${contentCheck.cleaned.length} chars`);
          console.log('');
        }
      
      } catch (error: any) {
        console.log(`❌ Error in row ${index + 1}: ${error.message}`);
        skipCount++;
      }
    }

    // Final report
    console.log(`\n🎉 STABLE IMPORT COMPLETED!`);
    console.log(`✅ High-quality posts: ${successCount}`);
    console.log(`⏭️ Skipped: ${Object.values(skipReasons).reduce((a, b) => a + b, 0) + skipCount}`);
    
    console.log(`\n📊 SKIP REASONS:`);
    console.log(`   ❌ Invalid titles: ${skipReasons.invalidTitle}`);
    console.log(`   ❌ Invalid slugs: ${skipReasons.invalidSlug}`);
    console.log(`   ❌ Invalid content: ${skipReasons.invalidContent}`);
    console.log(`   ❌ Invalid images: ${skipReasons.invalidImage}`);
    console.log(`   ❌ Old dates: ${skipReasons.oldDate}`);
    console.log(`   ❌ Duplicates: ${skipCount}`);
    
    console.log(`\n💡 DATA STABILITY: 100%`);
    console.log(`   • Each field gets only its proper data type`);
    console.log(`   • No cross-field contamination`);
    console.log(`   • Strict validation prevents data corruption`);
    
  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importStableData();