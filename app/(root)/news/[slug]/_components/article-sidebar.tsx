import Link from "next/link"
import Image from "next/image"
import { Mail, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { LiveScoreWidget } from "@/components/widgets/live-score"
import { getEconomyNews, getTopTrending, getAds, CATEGORIES } from "@/constants/news-data"

// This is a server component that fetches its own data
export async function ArticleSidebar() {
  const economyNews = await getEconomyNews()
  const trendingNews = await getTopTrending()
  const ads = await getAds()
  const sidebarAds = ads.filter((ad) => ad.type === "sidebar")

  return (
    <div className="space-y-8">
      {/* Live Score Widget */}
      <LiveScoreWidget />

      {/* Featured Topics Widget */}
      <div className="bg-card rounded-lg border border-border p-5">
        <h3 className="font-bold text-lg mb-4 flex items-center justify-between">
          <span>Featured Topics</span>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
        </h3>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.slice(0, 8).map((tag) => (
            <Link key={tag} href={`/news/${tag}`}>
              <Badge
                variant="secondary"
                className="hover:bg-blue-100 hover:text-blue-700 cursor-pointer px-3 py-1 rounded-md transition-all capitalize"
              >
                {tag}
              </Badge>
            </Link>
          ))}
        </div>
      </div>

      {/* Economy News Widget */}
      <div className="bg-card rounded-lg border border-border p-0 overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-bold text-lg text-blue-600 uppercase">Economy News</h3>
        </div>
        <div className="p-4 space-y-6">
          {economyNews.map((news) => (
            <div key={news.id} className="group">
              <Link href={`/news/${news.slug}`}>
                <div className="relative aspect-video w-full mb-3 rounded-md overflow-hidden">
                  <Image
                    src={news.image || "/placeholder.svg?height=200&width=300"}
                    alt={news.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-blue-600 hover:bg-blue-700 text-[10px] h-5">YOU JOINED US</Badge>
                  </div>
                </div>
                <h4 className="font-bold text-sm mb-1 group-hover:text-blue-600 transition-colors line-clamp-2">
                  {news.title}
                </h4>
              </Link>
              <div className="flex items-center text-xs text-muted-foreground mb-2">
                <span className="uppercase font-semibold mr-2">BY {news.author}</span>
                <span>— {news.date}</span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-3 mb-2">{news.excerpt}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Ad Block 1 */}
      {sidebarAds[0] && (
        <div className="bg-zinc-900 rounded-lg overflow-hidden text-white text-center">
          <div className="bg-zinc-800 text-xs py-1 text-zinc-400 uppercase tracking-wider">Advertisement</div>
          <div className="p-6">
            <h3 className="text-xl font-bold mb-4">{sidebarAds[0].title}</h3>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full w-full">
              {sidebarAds[0].description || "Learn More"}
            </Button>
            <div className="mt-6 relative h-32 w-full">
              <Image
                src={sidebarAds[0].image || "/placeholder.svg?height=150&width=300"}
                alt="Ad"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Trending Widget */}
      <div className="border-t-4 border-blue-600 pt-4">
        <h3 className="font-bold text-lg mb-6 flex items-center">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200 rounded-sm uppercase mr-2">
            TOP TRENDING
          </Badge>
        </h3>
        <div className="space-y-6">
          {trendingNews.map((news, index) => (
            <div key={news.id} className="group">
              {index === 0 ? (
                <Link href={`/news/${news.slug}`} className="block mb-4">
                  <div className="relative aspect-video w-full mb-3 rounded-lg overflow-hidden">
                    <Image
                      src={news.image || "/placeholder.svg?height=200&width=300"}
                      alt={news.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </Link>
              ) : null}

              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <span className="text-3xl font-bold text-blue-500/50 leading-none">{index + 1}.</span>
                </div>
                <div>
                  <Link href={`/news/${news.slug}`}>
                    <h4 className="font-bold text-sm mb-1 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {news.title}
                    </h4>
                  </Link>
                  <div className="text-xs text-muted-foreground">
                    <span className="uppercase font-semibold">By {news.author}</span>
                    <span className="mx-1">—</span>
                    <span>{news.date}</span>
                  </div>
                  {index === 0 && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{news.excerpt}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Newsletter Widget */}
      <div className="bg-zinc-50 dark:bg-zinc-900 border border-border rounded-lg p-6 text-center">
        <Mail className="h-10 w-10 mx-auto mb-4 text-foreground" />
        <h3 className="font-bold text-xl mb-2">Subscribe to News</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Get the latest sports news from NewsSite about world, sports and politics.
        </p>
        <div className="space-y-3">
          <Input placeholder="Your email address.." className="bg-background" />
          <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold uppercase">Subscribe</Button>
        </div>
        <div className="mt-4 flex items-start gap-2 text-left">
          <input type="checkbox" id="terms" className="mt-1" />
          <label htmlFor="terms" className="text-xs text-muted-foreground">
            By signing up, you agree to the our terms and our Privacy Policy agreement.
          </label>
        </div>
      </div>

      {/* Ad Block 2 */}
      {sidebarAds[1] && (
        <div className="bg-blue-900 rounded-lg overflow-hidden text-white relative">
          <div className="bg-black/30 text-xs py-1 text-center text-white/70 uppercase tracking-wider">
            Advertisement
          </div>
          <div className="p-6 flex items-center justify-between">
            <div className="w-2/3">
              <h3 className="font-bold leading-tight mb-2">{sidebarAds[1].title}</h3>
              <Button size="sm" className="bg-white text-blue-900 hover:bg-gray-100 text-xs font-bold">
                {sidebarAds[1].description}
              </Button>
            </div>
            <div className="w-1/3">
              <div className="text-4xl font-black italic text-white/20">WORD</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
