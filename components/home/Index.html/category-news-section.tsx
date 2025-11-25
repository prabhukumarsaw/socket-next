import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import SectionHeader from "../SectionHeader"
import { AdSidebar } from "@/components/ads/ad-sidebar"
import type {
  CategoryBlockTypeAData,
  CategoryBlockTypeBData,
  TopTrendingItem,
  ExclusiveNewsItem,
  SidebarSmallListItem,
} from "@/lib/utils/category-section-mapper"

interface CategoryNewsSectionProps {
  politics: CategoryBlockTypeAData
  sports: CategoryBlockTypeAData
  entertainment: CategoryBlockTypeBData
  crime: CategoryBlockTypeAData
  topTrending: TopTrendingItem[]
  exclusiveNews: ExclusiveNewsItem[]
  sidebarBottom: SidebarSmallListItem[]
}

export function CategoryNewsSection({
  politics,
  sports,
  entertainment,
  crime,
  topTrending,
  exclusiveNews,
  sidebarBottom,
}: CategoryNewsSectionProps) {
  return (
    <section className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Content Column (80% on desktop) */}
        <div className="lg:col-span-9 space-y-12">
          {/* politics*/}
          <CategoryBlockTypeA data={politics} imagePosition="left" />

          {/* Sports Section */}
          <CategoryBlockTypeA data={sports} imagePosition="right" />

          {/* entertainment Section */}
          <CategoryBlockTypeB data={entertainment} />

{/* Crime Section */}
          <CategoryBlockTypeA data={crime} imagePosition="left" />
        </div>

        {/* Right Sidebar Column (20% on desktop) */}
        <div className="lg:col-span-3 space-y-12">
          {/* Top Trending */}
          <SidebarTopTrending data={topTrending} />

          {/* Exclusive News */}
          <SidebarExclusiveNews data={exclusiveNews} />

          {/* Sidebar Bottom List */}
          <SidebarSmallList data={sidebarBottom} />

          {/* Ad Unit - Dynamic */}
          <AdSidebar position={2} showDefault={true} />
        </div>
      </div>
    </section>
  )
}



function CategoryBlockTypeA({
  data,
  imagePosition = "left",
}: {
  data: CategoryBlockTypeAData
  imagePosition?: "left" | "right"
}) {
  const featuredSlug = data.featured.slug || "#";
  
  return (
    <div className="w-full">
      <SectionHeader title={data.title} />

      {/* Featured Article */}
      <Link href={`/news/${featuredSlug}`} className="flex flex-col md:flex-row gap-6 mb-8 group cursor-pointer">
        <div
          className={cn(
            "relative w-full md:w-[60%] aspect-[16/9] overflow-hidden",
            imagePosition === "right" && "md:order-2",
          )}
        >
          <Image
            src={data.featured.image || "/placeholder.svg"}
            alt={data.featured.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </div>
        <div className="w-full md:w-[40%] flex flex-col justify-center">
          <h3 className="text-2xl md:text-3xl font-serif font-bold leading-tight mb-3 group-hover:text-blue-600 transition-colors">
            {data.featured.title}
          </h3>
          <div className="flex items-center text-xs text-gray-500 mb-4 uppercase tracking-wider font-medium">
            <span className="text-black mr-2">By {data.featured.author}</span>
            <span>— {data.featured.date}</span>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed line-clamp-4">{data.featured.excerpt}</p>
        </div>
      </Link>

      {/* Sub Articles Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-gray-200">
        {data.subArticles.map((article, idx) => (
          <Link 
            key={idx} 
            href={`/news/${article.slug || "#"}`}
            className="group cursor-pointer"
          >
            <h4 className="font-bold text-sm leading-snug group-hover:text-blue-600 transition-colors">
              {article.title}
            </h4>
          </Link>
        ))}
      </div>
    </div>
  )
}

function CategoryBlockTypeB({ data }: { data: CategoryBlockTypeBData }) {
  const featuredSlug = data.featured.slug || "#";
  
  return (
    <div className="w-full">
      <SectionHeader title={data.title} />

      {/* Top Featured */}
      <Link href={`/news/${featuredSlug}`} className="flex flex-col md:flex-row gap-6 mb-8 group cursor-pointer">
        <div className="w-full md:w-[60%] flex flex-col justify-center">
          <h3 className="text-2xl font-serif font-bold leading-tight mb-3 group-hover:text-blue-600 transition-colors">
            {data.featured.title}
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">{data.featured.excerpt}</p>
        </div>
        <div className="relative w-full md:w-[40%] aspect-[3/2] overflow-hidden">
          <Image
            src={data.featured.image || "/placeholder.svg"}
            alt={data.featured.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </div>
      </Link>

      {/* Middle Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 py-6 border-t border-gray-200">
        {data.middleArticles.map((article, idx) => (
          <Link 
            key={idx} 
            href={`/news/${article.slug || "#"}`}
            className="flex gap-4 group cursor-pointer items-center"
          >
            <div className="relative w-24 h-16 flex-shrink-0 overflow-hidden">
              <Image
                src={article.image || "/placeholder.svg"}
                alt={article.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>
            <h4 className="font-bold text-sm leading-snug group-hover:text-blue-600 transition-colors line-clamp-3">
              {article.title}
            </h4>
          </Link>
        ))}
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-gray-200">
        {data.bottomArticles.map((article, idx) => (
          <Link 
            key={idx} 
            href={`/news/${article.slug || "#"}`}
            className="group cursor-pointer"
          >
            <h4 className="font-bold text-sm leading-snug group-hover:text-blue-600 transition-colors">
              {article.title}
            </h4>
          </Link>
        ))}
      </div>
    </div>
  )
}

function SidebarTopTrending({ data }: { data: TopTrendingItem[] }) {
  return (
    <div className="w-full">
      <SectionHeader title="TOP TRENDING" />
      <div className="space-y-8">
        {data.map((item, idx) => (
          <Link 
            key={item.id} 
            href={`/news/${item.slug}`}
            className="group cursor-pointer block"
          >
            <div className="relative w-full aspect-[3/2] mb-3 overflow-hidden">
              <Image
                src={item.image || "/placeholder.svg"}
                alt={item.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            <div className="flex gap-3">
              <span className="text-3xl font-black text-blue-500 leading-none">{item.id}.</span>
              <h3 className="font-serif font-bold text-lg leading-tight group-hover:text-blue-600 transition-colors">
                {item.title}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

function SidebarExclusiveNews({ data }: { data: ExclusiveNewsItem[] }) {
  return (
    <div className="w-full">
      <SectionHeader title="EXCLUSIVE NEWS" />
      <div className="grid grid-cols-2 gap-4">
        {data.map((item, idx) => (
          <Link 
            key={idx} 
            href={`/news/${item.slug}`}
            className="group cursor-pointer block"
          >
            <div className="relative w-full aspect-[3/2] mb-2 overflow-hidden">
              <Image
                src={item.image || "/placeholder.svg"}
                alt={item.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>
            <h4 className="text-xs font-bold leading-snug group-hover:text-blue-600 transition-colors line-clamp-3">
              {item.title}
            </h4>
          </Link>
        ))}
      </div>
    </div>
  )
}

function SidebarSmallList({ data }: { data: SidebarSmallListItem[] }) {
  return (
    <div className="w-full space-y-6 pt-6 border-t border-gray-200">
      {data.map((item, idx) => (
        <Link 
          key={idx} 
          href={`/news/${item.slug}`}
          className="flex gap-4 group cursor-pointer"
        >
          <div className="relative w-24 h-16 flex-shrink-0 overflow-hidden">
            <Image
              src={item.image || "/placeholder.svg"}
              alt={item.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
          </div>
          <h4 className="font-bold text-sm leading-snug group-hover:text-blue-600 transition-colors line-clamp-3">
            {item.title}
          </h4>
        </Link>
      ))}
    </div>
  )
}
