import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { getTrending } from "@/constants/news-data"
import { Badge } from "@/components/ui/badge"
import { AdSidebar } from "@/components/ads/ad-sidebar"

export async function NewsSidebar() {
  const trending = await getTrending()
  const tags = ["Politics", "Technology", "Environment", "Business", "Space", "AI", "Health"]

  return (
    <aside className="flex flex-col gap-8">
      {/* Ad Block 1 - Dynamic */}
      <AdSidebar className="mb-8" position={0} showDefault={true} />

      {/* Trending / Latest News */}
      <div className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-5">
        <h3 className="text-lg font-bold text-white mb-4 border-l-4 border-blue-500 pl-3">Latest News</h3>
        <div className="space-y-4">
          {trending.map((item) => (
            <Link key={item.id} href={`/news/${item.category}/${item.slug}`} className="flex gap-3 group">
              <div className="relative w-20 h-14 flex-shrink-0 rounded-md overflow-hidden bg-zinc-800">
                <Image
                  src={item.image || "/placeholder.svg"}
                  alt=""
                  fill
                  className="object-cover group-hover:scale-110 transition-transform"
                />
              </div>
              <h4 className="text-sm text-zinc-300 font-medium line-clamp-2 group-hover:text-blue-400 transition-colors">
                {item.title}
              </h4>
            </Link>
          ))}
        </div>
      </div>

      {/* Ad Block 2 - Dynamic */}
      <AdSidebar className="mb-8" position={1} showDefault={true} />

      {/* Featured Tags */}
      <div className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-5">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
          <span>Featured Topics</span>
          <ArrowRight className="w-4 h-4 text-zinc-500" />
        </h3>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white cursor-pointer px-3 py-1 rounded-md transition-all"
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </aside>
  )
}
