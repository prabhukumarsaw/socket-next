// scripts/assign-categories-auto.ts
// @ts-nocheck
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DEFAULT_NEWS_IMAGE =
  process.env.DEFAULT_NEWS_IMAGE ||
  'https://cdn.bawalnews.com/static/images/news-placeholder.jpg';

async function ensureDefaultCoverImages(): Promise<number> {
  const placeholder = DEFAULT_NEWS_IMAGE;

  const result = await prisma.news.updateMany({
    where: {
      OR: [{ coverImage: null }, { coverImage: '' }],
    },
    data: {
      coverImage: placeholder,
    },
  });

  if (result.count > 0) {
    console.log(`🖼️ Applied default cover image to ${result.count} posts missing artwork`);
  }

  return result.count;
}

// Enhanced category keywords with Hindi and English terms
const CATEGORY_KEYWORDS = {
  // झारखंड (Jharkhand)
  'cmiemmhci001fh4x8pv84gi9l': [
    // Hindi keywords
    'झारखंड', 'रांची', 'जमशेदपुर', 'धनबाद', 'बोकारो', 'देवघर', 'हजारीबाग', 
    'चाईबासा', 'कोडरमा', 'गिरिडीह', 'सिंहभूम', 'संथाल', 'आदिवासी',
    'झारखंड सरकार', 'झारखंड विधानसभा', 'हेमंत सोरेन', 'झारखंड पुलिस',
    'कोलhan', 'खनन', 'वन', 'जंगल', 'पहाड़', 'छोटानागपुर',
    
    // English keywords
    'jharkhand', 'ranchi', 'jamshedpur', 'dhanbad', 'bokaro', 'deoghar',
    'hazaribagh', 'chaibasa', 'koderma', 'giridih', 'singhbhum', 'santal',
    'tribal', 'jharkhand government', 'jharkhand assembly', 'hemant soren'
  ],
  
  // बिहार (Bihar)
  'cmiemmhd7001gh4x82zsiyhu7': [
    // Hindi keywords
    'बिहार', 'पटना', 'मुजफ्फरपुर', 'गया', 'भागलपुर', 'दरभंगा', 'पूर्णिया',
    'अररिया', 'किशanganj', 'मधुबनी', 'समस्तीपुर', 'बेगूसराय', 'सीवान',
    'बिहार सरकार', 'बिहार विधानसभा', 'नीतीश कुमार', 'तेजस्वी यादव',
    'लालू प्रसाद', 'सीएम नीतीश', 'बिहार पुलिस', 'गंगा', 'सोन', 'कोसी',
    
    // English keywords
    'bihar', 'patna', 'muzaffarpur', 'gaya', 'bhagalpur', 'darbhanga',
    'purnia', 'araria', 'kishanganj', 'madhubani', 'samastipur', 'begusarai',
    'siwan', 'bihar government', 'nitish kumar', 'tejashwi yadav', 'lalu prasad'
  ],
  
  // राजनीति (Politics)
  'cmiemmhdf001hh4x800wk3mgp': [
    // Hindi keywords
    'राजनीति', 'सरकार', 'मंत्री', 'चुनाव', 'विधानसभा', 'संसद', 'लोकसभा',
    'राज्यसभा', 'राजनीतिक', 'पार्टी', 'भाजपा', 'कांग्रेस', 'आप', 'जेडीयू',
    'आरजेडी', 'विधायक', 'सांसद', 'मुख्यमंत्री', 'प्रधानमंत्री', 'राष्ट्रपति',
    'चुनाव आयोग', 'मतदान', 'रैली', 'जनसभा', 'राजनीतिक दल',
    
    // English keywords
    'politics', 'government', 'minister', 'election', 'assembly', 'parliament',
    'lok sabha', 'rajya sabha', 'political', 'party', 'bjp', 'congress', 'aap',
    'jdu', 'rjd', 'mla', 'mp', 'chief minister', 'prime minister', 'president'
  ],
  
  // खेल (Sports)
  'cmiemmhed001ih4x8px3wl5sk': [
    // Hindi keywords
    'खेल', 'क्रिकेट', 'फुटबॉल', 'हॉकी', 'टेनिस', 'बैडमिंटन', 'खिलाड़ी',
    'मैच', 'टूर्नामेंट', 'विश्व कप', 'ओलंपिक', 'एशियाई खेल', 'कमांवल',
    'स्टेडियम', 'कोच', 'टीम', 'जीत', 'हार', 'पदक', 'स्वर्ण', 'रजत', 'कांस्य',
    'आईपीएल', 'विश्वकप', 'चैम्पियनशिप', 'लीग',
    
    // English keywords
    'sports', 'cricket', 'football', 'hockey', 'tennis', 'badminton', 'player',
    'match', 'tournament', 'world cup', 'olympics', 'asian games', 'commonwealth',
    'stadium', 'coach', 'team', 'win', 'loss', 'medal', 'gold', 'silver', 'bronze',
    'ipl', 'worldcup', 'championship', 'league'
  ],
  
  // देश-विदेश (Country/World)
  'cmiemmhbr001eh4x8zrzkrhzt': [
    // Hindi keywords
    'देश', 'विदेश', 'अंतर्राष्ट्रीय', 'विश्व', 'भारत', 'अमेरिका', 'चीन',
    'रूस', 'पाकिस्तान', 'बांग्लादेश', 'श्रीलंका', 'नेपाल', 'विदेश मंत्री',
    'अंतर्राष्ट्रीय संबंध', 'विदेश नीति', 'वैश्विक', 'यूएन', 'संयुक्त राष्ट्र',
    'नाटो', 'यूक्रेन', 'इजराइल', 'फिलिस्तीन', 'मध्य पूर्व', 'यूरोप', 'अमेरिकी',
    'चीनी', 'रूसी', 'विदेश यात्रा', 'राजदूत', 'विदेश संबंध',
    
    // English keywords
    'country', 'foreign', 'international', 'world', 'india', 'america', 'china',
    'russia', 'pakistan', 'bangladesh', 'sri lanka', 'nepal', 'foreign minister',
    'international relations', 'foreign policy', 'global', 'un', 'united nations',
    'nato', 'ukraine', 'israel', 'palestine', 'middle east', 'europe', 'american',
    'chinese', 'russian', 'ambassador', 'diplomacy'
  ]
};

interface CategoryMatch {
  categoryId: string;
  categoryName: string;
  score: number;
  matchedKeywords: string[];
}

/**
 * Extract plain text from Lexical JSON content
 */
function extractTextFromLexical(lexicalJson: string): string {
  try {
    const content = JSON.parse(lexicalJson);
    let text = '';

    function extractTextFromNode(node: any) {
      if (node.text) {
        text += node.text + ' ';
      }
      if (node.children) {
        node.children.forEach(extractTextFromNode);
      }
    }

    if (content.root && content.root.children) {
      content.root.children.forEach(extractTextFromNode);
    }

    return text;
  } catch (error) {
    return '';
  }
}

/**
 * Analyze content and find the best matching categories
 */
function findBestCategories(title: string, content: string, excerpt: string): CategoryMatch[] {
  const searchText = (title + ' ' + excerpt + ' ' + content).toLowerCase();
  const matches: CategoryMatch[] = [];

  // Check each category
  for (const [categoryId, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const matchedKeywords: string[] = [];
    let score = 0;

    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'gi');
      const keywordMatches = searchText.match(regex);
      
      if (keywordMatches) {
        matchedKeywords.push(keyword);
        // Weight based on keyword importance and length
        const weight = keyword.length > 4 ? 3 : 
                      keyword.length > 2 ? 2 : 1;
        score += keywordMatches.length * weight;
      }
    }

    if (score > 0) {
      matches.push({
        categoryId,
        categoryName: getCategoryName(categoryId),
        score,
        matchedKeywords
      });
    }
  }

  // Sort by score descending and return top 2 categories
  return matches.sort((a, b) => b.score - a.score).slice(0, 2);
}

/**
 * Get category name from ID
 */
function getCategoryName(categoryId: string): string {
  const categoryNames: Record<string, string> = {
    'cmiemmhci001fh4x8pv84gi9l': 'झारखंड',
    'cmiemmhd7001gh4x82zsiyhu7': 'बिहार',
    'cmiemmhdf001hh4x800wk3mgp': 'राजनीति',
    'cmiemmhed001ih4x8px3wl5sk': 'खेल',
    'cmiemmhbr001eh4x8zrzkrhzt': 'देश-विदेश'
  };
  
  return categoryNames[categoryId] || 'Unknown';
}

/**
 * Assign categories to all news posts automatically
 */
async function assignCategoriesAutomatically() {
  try {
    console.log('🚀 Starting Automatic Category Assignment\n');

    // Get all news posts
    const newsPosts = await prisma.news.findMany({
      select: {
        id: true,
        title: true,
        content: true,
        excerpt: true,
        slug: true,
        categories: {
          select: {
            menuId: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📊 Found ${newsPosts.length} total news posts`);

    // Filter posts that don't have categories
    const postsWithoutCategories = newsPosts.filter(post => post.categories.length === 0);
    const postsWithCategories = newsPosts.filter(post => post.categories.length > 0);

    console.log(`📝 Posts with categories: ${postsWithCategories.length}`);
    console.log(`📝 Posts without categories: ${postsWithoutCategories.length}\n`);

    let assignedCount = 0;
    let multiCategoryCount = 0;
    let defaultAssignedCount = 0;

    // Process posts without categories
    for (const post of postsWithoutCategories) {
      try {
        // Extract text from Lexical content
        const contentText = extractTextFromLexical(post.content);
        const searchText = post.title + ' ' + (post.excerpt || '') + ' ' + contentText;

        // Find best matching categories
        const bestMatches = findBestCategories(post.title, contentText, post.excerpt || '');

        let categoriesToAssign: string[] = [];

        if (bestMatches.length > 0) {
          // Use the matched categories
          categoriesToAssign = bestMatches.map(match => match.categoryId);
          
          if (bestMatches.length > 1) {
            multiCategoryCount++;
            console.log(`🎯 [${assignedCount + 1}] "${post.title.substring(0, 50)}..." → ${bestMatches.map(m => m.categoryName).join(' + ')}`);
          } else {
            console.log(`✅ [${assignedCount + 1}] "${post.title.substring(0, 50)}..." → ${bestMatches[0].categoryName}`);
          }
        } else {
          // Assign default category (Politics as fallback)
          categoriesToAssign = ['cmiemmhdf001hh4x800wk3mgp']; // Politics
          defaultAssignedCount++;
          console.log(`🔷 [${assignedCount + 1}] "${post.title.substring(0, 50)}..." → DEFAULT (राजनीति)`);
        }

        // Create category relationships
        for (const categoryId of categoriesToAssign) {
          // Check if relationship already exists
          const existingRelation = await prisma.newsCategory.findFirst({
            where: {
              newsId: post.id,
              menuId: categoryId
            }
          });

          if (!existingRelation) {
            await prisma.newsCategory.create({
              data: {
                newsId: post.id,
                menuId: categoryId
              }
            });
          }
        }

        assignedCount++;

        // Progress update every 10 posts
        if (assignedCount % 10 === 0) {
          console.log(`📈 Progress: ${assignedCount}/${postsWithoutCategories.length} posts processed...`);
        }

      } catch (error) {
        console.error(`❌ Error processing post ${post.id}:`, error);
      }
    }

    // Final statistics
    console.log('\n' + '='.repeat(60));
    console.log('🎉 CATEGORY ASSIGNMENT COMPLETED!');
    console.log('='.repeat(60));
    console.log(`✅ Total posts processed: ${assignedCount}`);
    console.log(`🎯 Single category assigned: ${assignedCount - multiCategoryCount - defaultAssignedCount}`);
    console.log(`🔗 Multiple categories assigned: ${multiCategoryCount}`);
    console.log(`🔷 Default category assigned: ${defaultAssignedCount}`);
    console.log(`📊 Posts already had categories: ${postsWithCategories.length}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Category assignment failed:', error);
    throw error;
  }
}

/**
 * Show category assignment preview (dry run)
 */
async function previewCategoryAssignment() {
  console.log('🔍 PREVIEW MODE - Category Assignment Preview\n');

  const samplePosts = await prisma.news.findMany({
    where: {
      categories: {
        none: {}
      }
    },
    select: {
      id: true,
      title: true,
      content: true,
      excerpt: true
    },
    take: 10
  });

  console.log(`📝 Previewing ${samplePosts.length} sample posts:\n`);

  for (const post of samplePosts) {
    const contentText = extractTextFromLexical(post.content);
    const bestMatches = findBestCategories(post.title, contentText, post.excerpt || '');

    console.log(`📰 "${post.title}"`);
    if (bestMatches.length > 0) {
      bestMatches.forEach((match, index) => {
        console.log(`   ${index + 1}. ${match.categoryName} (Score: ${match.score})`);
        console.log(`      Matched: ${match.matchedKeywords.slice(0, 3).join(', ')}${match.matchedKeywords.length > 3 ? '...' : ''}`);
      });
    } else {
      console.log(`   🔷 DEFAULT: राजनीति (Politics)`);
    }
    console.log('');
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const isPreview = args.includes('--preview') || args.includes('-p');

  if (isPreview) {
    await previewCategoryAssignment();
  } else {
    await assignCategoriesAutomatically();
  }
}

// Run the script
main()
  .then(() => {
    console.log('\n✨ Category assignment script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

export { assignCategoriesAutomatically, previewCategoryAssignment };