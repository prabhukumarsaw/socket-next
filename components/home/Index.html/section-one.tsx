import Image from "next/image"
import Link from "next/link"
import { Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import SectionHeader from "../SectionHeader"
import { AdSidebar } from "@/components/ads/ad-sidebar"

interface Article {
    id: string
    title: string
    excerpt: string
    image: string
    category: string
    date: string
    author: string
    isLive?: boolean
}


interface SmallArticle {
    id: string
    title: string
    image: string
}

interface FeaturedSectionProps {
    categoryName?: string
    featuredArticle: Article
    sideArticles: Article[]
    rightArticles: SmallArticle[]
}

export function OneSection({ categoryName = "TECHNOLOGY", featuredArticle, sideArticles, rightArticles }: FeaturedSectionProps) {
    return (
        <section className="container mx-auto px-4 py-8">
            <SectionHeader title={categoryName} />
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left: Large Featured Article */}
                <div className="lg:col-span-2">
                    <Link href={`/news/${featuredArticle.id}`} className="group block">
                        <div className="overflow-hidden rounded-lg bg-card shadow-sm">
                            <div className="relative aspect-[16/10] w-full overflow-hidden">
                                <Image
                                    src={featuredArticle.image || "/placeholder.svg"}
                                    alt={featuredArticle.title}
                                    fill
                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                                {featuredArticle.isLive && (
                                    <div className="absolute left-4 top-4">
                                        <Badge className="bg-blue-600 hover:bg-blue-700">
                                            <span className="mr-1.5 inline-block size-2 animate-pulse rounded-full bg-white" />
                                            LIVE UPDATES
                                        </Badge>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                                <div className="absolute bottom-0 left-0 right-0 p-6">
                                    <Badge className="mb-3 bg-primary/90 hover:bg-primary">{featuredArticle.category}</Badge>
                                    <h2 className="mb-3 text-balance text-2xl font-bold leading-tight text-white md:text-3xl lg:text-4xl">
                                        {featuredArticle.title}
                                    </h2>
                                    <p className="mb-3 line-clamp-2 text-pretty text-sm text-white/90 md:text-base">
                                        {featuredArticle.excerpt}
                                    </p>
                                    <div className="flex items-center gap-3 text-sm text-white/80">
                                        <Calendar className="size-4" />
                                        <span>Updated: {featuredArticle.date}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Right: Two Stacked Articles */}
                <div className="flex flex-col gap-6">
                    {sideArticles.map((article) => (
                        <Link key={article.id} href={`/news/${article.id}`} className="group block">
                            <div className="overflow-hidden rounded-lg bg-card shadow-sm transition-shadow hover:shadow-md">
                                <div className="relative aspect-[16/10] w-full overflow-hidden">
                                    <Image
                                        src={article.image || "/placeholder.svg"}
                                        alt={article.title}
                                        fill
                                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                                    <div className="absolute bottom-0 left-0 right-0 p-4">
                                        <Badge className="mb-2 bg-primary/90 hover:bg-primary text-xs">{article.category}</Badge>
                                        <h3 className="mb-2 text-balance text-lg font-bold leading-tight text-white md:text-xl">
                                            {article.title}
                                        </h3>
                                        <p className="line-clamp-2 text-pretty text-xs text-white/90 md:text-sm">{article.excerpt}</p>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Left: News Just In List */}
               <div className="lg:col-span-2">
  <div className="grid sm:grid-cols-2 border-t border-l border-border">
    {rightArticles.map((article) => (
      <Link
        key={article.id}
        href={`/news/${article.id}`}
        className="group border-b border-r border-border p-4 hover:bg-muted/20 transition-colors"
      >
        <div className="flex gap-4">
          <div className="relative size-24 shrink-0 overflow-hidden rounded-md">
            <Image
              src={article.image || "/placeholder.svg"}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-110"
            />
          </div>

          <div className="flex-1">
            <h4 className="expert leading-snug transition-colors">
              {article.title}
            </h4>
          </div>
        </div>
      </Link>
    ))}
  </div>
</div>



                {/* Right: Ad Space */}
                <div className="lg:col-span-1">
                    <AdSidebar showDefault={true} />
                </div>

            </div>

        </section>
    )
}
