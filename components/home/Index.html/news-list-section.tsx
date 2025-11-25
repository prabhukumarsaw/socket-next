import Image from "next/image"
import Link from "next/link"

interface NewsItem {
  id: string
  title: string
  excerpt?: string
}

interface SmallArticle {
  id: string
  title: string
  image: string
}

interface NewsListSectionProps {
  newsJustIn: NewsItem[]
  rightArticles: SmallArticle[]
}

export function NewsListSection({ newsJustIn, rightArticles }: NewsListSectionProps) {
  return (
    <section className="container mx-auto px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left: News Just In List */}
        <div className="lg:col-span-1">
          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-6 text-xl font-bold uppercase tracking-wide text-primary">News Just In</h2>
            <ul className="space-y-4">
              {newsJustIn.map((news) => (
                <li key={news.id} className="group">
                  <Link href={`/article/${news.id}`} className="flex items-start gap-3">
                    <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" />
                    <div>
                      <h3 className="text-pretty font-semibold leading-snug transition-colors group-hover:text-primary">
                        {news.title}
                      </h3>
                      {news.excerpt && <p className="mt-1 text-sm text-muted-foreground">{news.excerpt}</p>}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right: Grid of Small Articles with Images */}
        <div className="lg:col-span-2">
          <div className="grid gap-6 sm:grid-cols-2">
            {rightArticles.map((article) => (
              <Link key={article.id} href={`/article/${article.id}`} className="group">
                <div className="flex gap-4 rounded-lg border bg-card p-4 transition-shadow hover:shadow-md">
                  <div className="relative size-24 shrink-0 overflow-hidden rounded">
                    <Image
                      src={article.image || "/placeholder.svg"}
                      alt={article.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-pretty text-sm font-semibold leading-snug transition-colors group-hover:text-primary">
                      {article.title}
                    </h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
