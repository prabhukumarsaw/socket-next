import { cache } from "react"

export interface Article {
  id: string
  title: string
  excerpt: string
  content: string
  image: string
  author: string
  source: string
  date: string
  slug: string
  category: string
  readTime?: string
  comments?: number
  updatedDate?: string
  tags?: string[]
  fullContent?: string
}

export interface Ad {
  id: string
  type: "banner" | "sidebar"
  image: string
  link: string
  title?: string
  description?: string
  category?: string
  readTime?: string
  commentsCount?: number
  updatedDate?: string
}

const MOCK_ARTICLES: Article[] = [
  {
    id: "1",
    title: "Grizzly Bear Attack On School Children And Teachers In Canada Injures 11",
    excerpt:
      "A grizzly bear attacked a group of schoolchildren and teachers on a walking trail in British Columbia, Canada, injuring 11 people, two of them critically.",
    content: "Full article content here...",
    image: "/grizzly-bear-forest.jpg",
    author: "Associated Press",
    source: "Associated Press",
    date: "Nov 21, 2025 23:55 pm IST",
    slug: "grizzly-bear-attack",
    category: "americas",
    readTime: "8 Mins Read",
    comments: 3,
    updatedDate: "Mar 8, 2026",
    tags: ["Wildlife", "Canada", "Safety"],
    fullContent: `
      <p>In the high-profile case of US-based journalist Peter Wilson, 16-year-old American journalist Clifford McGraw and 20-year-old British freelance journalist Jeremy Leslie have been charged with conspiring to violate the UK Foreign Office's <a href="#">anti-terror laws</a>, a charge he denies. On Monday, UK attorney Andy McDonald revealed that he had spoken.</p>
      
      <p>"Few worry about catching Covid anymore, as it's just a matter of time before they do," says Tea, a teacher at a school for special wants children, who experienced a fever and chills. "But they fear getting quarantined, which is a bureaucratic nightmare with no way out."</p>
      
      <p>Speaking to The <a href="#">Andrew Jackson Society</a>, he added: "I want to express to the people of Scotland: as you know, we are a country of strong and independent borders and we are prepared to protect them."</p>
      
      <p>The belief that the city's "dynamic" <a href="#">zero-Covid policy</a> could hold off any outbreak, combined with a failure to learn from other countries' experiences and prepare, have come at a high cost. High case counts — a record-breaking 59,000 infections were confirmed on Thursday, up from just a few hundred in early February — are <a href="#">translating into deaths</a>.</p>
      
      <blockquote>
        <p>"I have lived here since I am a little boy, so when I think about it, I say to myself: "There is nothing particular to be proud of, it was a really good place for us to live".</p>
        <cite>— McDonald's Jr.</cite>
      </blockquote>
      
      <p>Mr McDonald also said: "I believe in Britain, I believe in a strong and independent community, and I stand by every member of the people of Scotland.</p>
      
      <h2>What is their defense?</h2>
      
      <p>"It is a country of strong and independent borders and the strong people in Scotland must protect our country."</p>
      
      <p>A few months ago, Rob told a conference at Microsoft that the company would be making inroads into smart TVs and other wearables by 2020 and is on the verge of releasing a consumer version of its HoloLens.</p>
      
      <p>After this, senators were given twenty hours to ask questions of the two sides.</p>
      
      <ul>
        <li><a href="#">Anthony Zucker: Why there could be a speedy end</a></li>
        <li><a href="#">Did Jane's words at rally incite violence?</a></li>
      </ul>
      
      <p>He offered some more details about Microsoft's vision for smart TVs, though this would come as no surprise given the company's deep pockets and deep pockets for other smart devices and things that it's built to support.</p>
      
      <p>The more lightweight you keep an idea, <em>the quicker it gets executed</em> and the faster you get a feel for whether or not you should continue down the same road.</p>
      
      <p>We'd love to show you how to make a great living as a writer. Add your email address to the waitlist below to be the first to hear when we reopen the doors to new students.</p>
      
      <p class="text-zinc-500 italic mt-8">— With files from Global AFP and The British Press</p>
    `,
  },
  {
    id: "2",
    title: "As Polar Night Begins, This City Won't See Sun For Next 64 Days",
    excerpt:
      "The Polar Night phenomenon, caused by the tilt of the Earth's axis, will leave the town without direct sunlight until January 22, 2026.",
    content: "Full article content here...",
    image: "/polar-night-city-snow.jpg",
    author: "NDTV News Desk",
    source: "NDTV",
    date: "Nov 21, 2025 09:58 am IST",
    slug: "polar-night-begins",
    category: "americas",
    readTime: "5 Mins Read",
    comments: 12,
    updatedDate: "Nov 22, 2025",
    tags: ["Nature", "Climate", "Arctic"],
    fullContent: `
      <p>A remote Arctic town is about to experience one of nature's most extraordinary phenomena. For the next 64 days, residents will live in complete darkness as the Polar Night takes hold.</p>
      <p>The Polar Night occurs when areas within the Arctic Circle experience 24 hours of darkness due to the Earth's axial tilt. This natural phenomenon affects daily life in profound ways, from disrupting sleep patterns to requiring artificial lighting throughout the day.</p>
      <p>Residents have adapted to this annual occurrence with innovative solutions, including light therapy lamps, adjusted work schedules, and community gatherings to maintain social connections during the dark months.</p>
    `,
  },
  {
    id: "3",
    title: "SpaceX Launches New Starship Mission to Mars",
    excerpt:
      "Elon Musk confirms the successful launch of the latest Starship prototype, aiming for a landing on the Red Planet within six months.",
    content: "Full article content here...",
    image: "/spacex-rocket-launch.jpg",
    author: "Science Desk",
    source: "Reuters",
    date: "Nov 20, 2025 14:30 pm IST",
    slug: "spacex-mars-mission",
    category: "science",
    readTime: "6 Mins Read",
    comments: 45,
    tags: ["Space", "Mars", "Technology"],
    fullContent: `
      <p>SpaceX has successfully launched its latest Starship prototype on an ambitious journey to Mars, marking a significant milestone in human space exploration.</p>
      <p>The launch, which took place at SpaceX's Starbase facility in Texas, represents years of development and testing. CEO Elon Musk expressed confidence in the mission's success, citing improved propulsion systems and advanced navigation technology.</p>
    `,
  },
  {
    id: "4",
    title: "Global Markets Rally as Inflation Hits Record Low",
    excerpt:
      "Major indices across the world saw significant gains today as new reports suggest inflation has finally stabilized below 2%.",
    content: "Full article content here...",
    image: "/stock-market-bull.png",
    author: "Finance Team",
    source: "Bloomberg",
    date: "Nov 20, 2025 10:15 am IST",
    slug: "markets-rally-inflation",
    category: "business",
    readTime: "4 Mins Read",
    comments: 28,
    tags: ["Economy", "Markets", "Finance"],
    fullContent: `
      <p>Global financial markets experienced a significant rally today as inflation data came in below expectations, signaling potential economic stability ahead.</p>
      <p>The S&P 500 gained 2.3%, while European and Asian markets also posted strong gains. Analysts attribute the positive movement to decreased inflationary pressures and optimistic corporate earnings reports.</p>
    `,
  },
  {
    id: "5",
    title: "New AI Regulation Bill Passes Senate",
    excerpt:
      "The landmark legislation aims to set safety standards for advanced artificial intelligence models while promoting innovation.",
    content: "Full article content here...",
    image: "/ai-technology-law.jpg",
    author: "Politics Desk",
    source: "The Hill",
    date: "Nov 19, 2025 16:45 pm IST",
    slug: "ai-bill-passes",
    category: "politics",
    readTime: "7 Mins Read",
    comments: 67,
    tags: ["AI", "Regulation", "Technology"],
    fullContent: `
      <p>The Senate has passed a groundbreaking bill establishing comprehensive regulations for artificial intelligence development and deployment.</p>
      <p>The legislation includes provisions for safety testing, transparency requirements, and ethical guidelines while aiming to maintain America's competitive edge in AI innovation.</p>
    `,
  },
  {
    id: "6",
    title: "Wind Turbine Recycling Assessment Report: A Guide to Sustainable Recycling Industry",
    excerpt: "To understand the new politics stance and other pro nationals of recent...",
    content: "Full article content here...",
    image: "/images/screenshot-202025-11-22-20130651.png",
    author: "SHANE DOE",
    source: "NewsWire",
    date: "Jan 30, 2025",
    slug: "wind-turbine-recycling",
    category: "environment",
    readTime: "6 Mins Read",
    comments: 8,
    tags: ["Environment", "Sustainability", "Energy"],
  },
  {
    id: "7",
    title: "Global Handwashing Day 2023: Date, History, Significance and Theme",
    excerpt: "To understand the new politics stance and other pro nationals of recent...",
    content: "Full article content here...",
    image: "/images/screenshot-202025-11-22-20130651.png",
    author: "SHANE DOE",
    source: "NewsWire",
    date: "Jan 30, 2025",
    slug: "global-handwashing-day",
    category: "health",
    readTime: "4 Mins Read",
    comments: 5,
  },
  {
    id: "8",
    title: "Global Banking Crisis Fears and Slowdown Approaching in 2024",
    excerpt: "To understand the new politics stance and other pro nationals of recent times, we should...",
    content: "Market analysis and regulatory updates...",
    image: "/images/screenshot-202025-11-22-20130634.png",
    author: "SHANE DOE",
    source: "NewsWire",
    date: "Jan 30, 2025",
    slug: "banking-crisis-2024",
    category: "economy",
    readTime: "8 Mins Read",
    comments: 34,
  },
  {
    id: "9",
    title: "Trump's Crackpot Crypto Scheme to Reduce Inflation Would Be a Financial Catastrophe",
    excerpt: "To understand the new politics stance and other pro nationals of recent...",
    content: "Detailed analysis of cryptocurrency proposals...",
    image: "/crypto-news.jpg",
    author: "Economics Desk",
    source: "Financial Times",
    date: "Jan 30, 2025",
    slug: "crypto-inflation-scheme",
    category: "economy",
    readTime: "9 Mins Read",
    comments: 156,
  },
  {
    id: "10",
    title: "Crypto Daybook Americas: Somber Crypto Market Eyes Slow Progress on U.S. Bitcoin Reserve",
    excerpt: "Cryptocurrency markets show cautious optimism as regulatory discussions continue...",
    content: "Market analysis and regulatory updates...",
    image: "/bitcoin-market.jpg",
    author: "Crypto Desk",
    source: "CoinDesk",
    date: "Jan 30, 2025",
    slug: "crypto-market-bitcoin-reserve",
    category: "economy",
    readTime: "5 Mins Read",
    comments: 89,
  },
  {
    id: "11",
    title: "What is Grey Divorce and Its Possible Implications? Know Everything Here",
    excerpt: "To understand the new politics stance and other pro nationals of recent...",
    content: "Comprehensive guide to grey divorce trends...",
    image: "/grey-divorce.jpg",
    author: "Lifestyle Desk",
    source: "Psychology Today",
    date: "Jan 30, 2025",
    slug: "grey-divorce-guide",
    category: "lifestyle",
    readTime: "7 Mins Read",
    comments: 23,
  },
  {
    id: "12",
    title: "Trevor Lawrance to Throw for Teams Sooner Than Expected",
    excerpt: "Breaking sports news as quarterback prepares for early return...",
    content: "Sports analysis and player updates...",
    image: "/trevor-lawrance.jpg",
    author: "Sports Desk",
    source: "ESPN",
    date: "Jan 30, 2025",
    slug: "trevor-lawrance-return",
    category: "sports",
    readTime: "3 Mins Read",
    comments: 67,
  },
  {
    id: "13",
    title: "The Cat Article Sparks Outrage Over Writer's Neglect of Her Cat",
    excerpt: "Controversial article generates heated discussion about pet care responsibilities...",
    content: "Social media response and expert opinions...",
    image: "/cat-article-outrage.jpg",
    author: "Lifestyle Team",
    source: "The Guardian",
    date: "Jan 30, 2025",
    slug: "cat-article-outrage",
    category: "lifestyle",
    readTime: "6 Mins Read",
    comments: 234,
  },
]

const MOCK_ADS: Ad[] = [
  {
    id: "ad1",
    type: "sidebar",
    image: "/business-woman-banner.jpg",
    link: "#",
    title: "Help your business stand out online.",
    description: "Ready for Business",
    category: "americas",
    readTime: "4 Mins Read",
    commentsCount: 12,
    updatedDate: "Nov 22, 2025",
  },
  {
    id: "ad2",
    type: "sidebar",
    image: "/blog-revenue-banner.jpg",
    link: "#",
    title: "Unlock your blog's true revenue potential",
    description: "Get Started",
    category: "americas",
    readTime: "4 Mins Read",
    commentsCount: 12,
    updatedDate: "Nov 22, 2025",
  },
]

// Simulate enterprise-grade data fetching with caching
export const getArticles = cache(async (category: string, page = 1, limit = 10) => {
  // Simulate network delay
  // await new Promise(resolve => setTimeout(resolve, 50))

  const filtered = MOCK_ARTICLES.filter(
    (a) => category === "all" || a.category.toLowerCase() === category.toLowerCase(),
  )

  const start = (page - 1) * limit
  const end = start + limit
  const items = filtered.slice(start, end)

  return {
    articles: items,
    total: filtered.length,
    totalPages: Math.ceil(filtered.length / limit),
  }
})

export const getAds = cache(async () => {
  return MOCK_ADS
})

export const getTrending = cache(async () => {
  return MOCK_ARTICLES.slice(0, 3)
})

export const getArticle = cache(async (slug: string) => {
  const article = MOCK_ARTICLES.find((a) => a.slug === slug)
  return article || null
})

export const getRelatedPosts = cache(async (currentId: string, limit = 3) => {
  return MOCK_ARTICLES.filter((a) => a.id !== currentId).slice(0, limit)
})

export const getEconomyNews = cache(async (limit = 2) => {
  const economyArticles = MOCK_ARTICLES.filter((a) => a.category === "economy" || a.category === "business")
  return economyArticles.slice(0, limit)
})

export const getTopTrending = cache(async (limit = 3) => {
  return MOCK_ARTICLES.slice(5, 5 + limit) // Get articles 6-8 for trending
})

export const getArticleBySlug = cache(async (slug: string) => {
  // Simulate network delay for realism
  // await new Promise(resolve => setTimeout(resolve, 100))

  const article = MOCK_ARTICLES.find((a) => a.slug === slug)
  return article || null
})

export const getRelatedArticles = cache(async (currentSlug: string, category: string, limit = 3) => {
  const related = MOCK_ARTICLES.filter(
    (a) => a.slug !== currentSlug && (a.category === category || Math.random() > 0.5),
  ).slice(0, limit)

  return related
})

export const CATEGORIES = [
  "jharkhand",
  "bihar",
  "politics",
  "sports",
  "country",
  "technology",
  "science",
  "health",
  "sports",
  "entertainment",
  "lifestyle",
]

export function isCategory(slug: string): boolean {
  return CATEGORIES.includes(slug.toLowerCase())
}
// </CHANGE>
