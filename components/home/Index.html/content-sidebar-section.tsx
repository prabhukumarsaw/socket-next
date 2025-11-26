import Image from "next/image"
import Link from "next/link"
import { Play } from "lucide-react"
import SectionHeader from "../SectionHeader"

interface Article {
  id: string
  title: string
  excerpt?: string
  image?: string
  category?: string
  date?: string
  author?: string
}

interface SidebarItem {
  id: string
  title: string
  image: string
  author?: string
}

interface ContentSidebarSectionProps {
  topHeadlines?: Article[]
  featuredArticle?: Article & { isVideo?: boolean }
  stateArticles?: Article[]
  moreNewsArticles?: Article[]
  sidebarTopArticle?: SidebarItem
  sidebarColumns?: SidebarItem[]
  sidebarOpinion?: { left: Article[]; right: Article[] }
}

export function ContentSidebarSection({
  topHeadlines = [],
  featuredArticle,
  stateArticles = [],
  moreNewsArticles = [],
  sidebarTopArticle,
  sidebarColumns = [],
  sidebarOpinion,
}: ContentSidebarSectionProps) {
  const jharkhandSupporting = topHeadlines.slice(0, 4)
  const biharPrimary = stateArticles.slice(0, 4)
  const biharSecondary = moreNewsArticles.slice(0, 6)
  return (
    <div className="w-full border-t-2 border-black mb-6">
      <div className="container mx-auto px-4 py-8 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-6">
          {/* Main Content Area - 80% on desktop */}
          <div className="w-full lg:w-[calc(75%-1.5rem)] space-y-8 ">
            {/* Featured Article with Video */}
            {featuredArticle && (
              <article className="pb-6 border-b-2 border-border">
                {/* Category Badge */}

                <SectionHeader title={`JHARKHAND`} />

                {/* Featured Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                  {/* Left: Title and Text */}
                  <div className="lg:col-span-4 space-y-4">
                      <Link href={`/news/${featuredArticle.id}`} className="group">
                        <span className="content-title leading-tight transition-colors duration-200">
                          {featuredArticle.title}
                        </span>
                      </Link>

                    {/* Author and Date */}
                    {featuredArticle.author && featuredArticle.date && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>By</span>
                        <span className="font-semibold text-foreground uppercase tracking-wide">
                          {featuredArticle.author}
                        </span>
                        <span>—</span>
                        <time className="text-muted-foreground">{featuredArticle.date}</time>
                        <p className="text-muted-foreground">{featuredArticle.category}</p>
                      </div>
                    )}

                    {/* Excerpt */}
                    {featuredArticle.excerpt && (
                      <h4 className="text-muted-foreground leading-relaxed">{featuredArticle.excerpt}</h4>
                    )}
                  </div>

                  {/* Right: Video/Image */}
                  <div className="lg:col-span-8">
                    <Link href={`/news/${featuredArticle.id}`} className="group block">
                      <div className="relative aspect-video bg-muted rounded-sm overflow-hidden">
                        {featuredArticle.image && (
                          <Image
                            src={featuredArticle.image || "/placeholder.svg"}
                            alt={featuredArticle.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="(max-width: 1024px) 100vw, 60vw"
                            priority
                          />
                        )}
                        {/* Video Play Button Overlay */}
                        {featuredArticle.isVideo && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors duration-200">
                            <div className="w-20 h-20 rounded-full bg-white/95 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-200">
                              <Play className="w-10 h-10 fill-foreground text-foreground ml-1" />
                            </div>
                          </div>
                        )}
                      </div>
                    </Link>
                  </div>
                </div>

                {jharkhandSupporting.length > 0 && (
                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-border">
                    {jharkhandSupporting.map((article) => (
                      <Link key={article.id} href={`/news/${article.id}`} className="group block">
                        <span className="headlines-title transition-colors duration-200 group-hover:text-primary">
                          {article.title}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </article>
            )}

            {/* Politics and More News - Two Column Layout */}
            {(biharPrimary.length > 0 || biharSecondary.length > 0) && (
              <section>
                <SectionHeader title="BIHAR" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-6">
                  {biharPrimary.length > 0 && (
                    <div className="space-y-4">
                      {biharPrimary.map((article) => (
                        <article key={article.id} className="flex gap-4 group cursor-pointer items-center">
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
                        </article>
                      ))}
                    </div>
                  )}

                  {biharSecondary.length > 0 && (
                    <div className="space-y-8 border-l border-border lg:pl-6">
                      {biharSecondary.map((article, index) => (
                        <article key={article.id} className="pb-4 last:pb-0 border-border">
                          {index === 0 && article.image ? (
                            <div className="space-y-4">
                              <Link href={`/news/${article.id}`} className="group">
                                <h3 className="font-serif text-xl lg:text-2xl font-bold leading-tight text-foreground group-hover:text-primary transition-colors duration-200">
                                  {article.title}
                                </h3>
                              </Link>
                              <Link href={`/news/${article.id}`} className="group block">
                                <div className="relative aspect-video bg-muted rounded-sm overflow-hidden">
                                  <Image
                                    src={article.image || "/placeholder.svg"}
                                    alt={article.title}
                                    fill
                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                    sizes="(max-width: 1024px) 100vw, 40vw"
                                  />
                                </div>
                              </Link>
                              {article.excerpt && (
                                <p className="text-sm text-muted-foreground leading-relaxed">{article.excerpt}</p>
                              )}
                            </div>
                          ) : (
                            <Link href={`/news/${article.id}`} className="group block">
                              <span className="headlines-sub-title leading-tight text-foreground group-hover:text-primary transition-colors duration-200">
                                {article.title}
                              </span>
                            </Link>
                          )}
                          {index < biharSecondary.length - 1 && <div className="mt-4 border-b border-border" />}
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
          <span className="border-r " />
          {/* Sidebar - 20% on desktop */}
          <aside className="w-full lg:w-[calc(25%-1.5rem)] space-y-10 lg:sticky lg:top-24 lg:self-start">
            {/* Top Featured Sidebar Article with Circular Image */}
            {sidebarTopArticle && (
              <div className="pb-10 border-b border-border">
                <article className="space-y-5">
                  <Link href={`/news/${sidebarTopArticle.id}`} className="group block">
                    <div className="relative mb-2 aspect-[3/2] w-full overflow-hidden rounded-sm">
                      <Image
                        src={sidebarTopArticle.image || "/placeholder.png"}
                        alt={sidebarTopArticle.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="200px"
                      />
                    </div>
                  </Link>
                  <div className="text-center lg:text-left">
                    <Link href={`/news/${sidebarTopArticle.id}`} className="group">
                      <h3 className="feature-section-font duration-200">
                        {sidebarTopArticle.title}
                      </h3>
                    </Link>
                    {sidebarTopArticle.author && (
                      <p className="text-xs text-muted-foreground mt-3">
                        By{" "}
                        <span className="font-semibold text-foreground uppercase tracking-wide">
                          {sidebarTopArticle.author}
                        </span>
                      </p>
                    )}
                  </div>
                </article>
              </div>
            )}

            {/* Columns Section */}
            {sidebarColumns.length > 0 && (
              <section className="pb-10 border-b border-border">
                <div className="mb-8">
                  <span className="text-sm font-bold text-primary uppercase tracking-wider">Columns</span>
                </div>
                <div className="space-y-8">
                  {sidebarColumns.slice(0, 5).map((item) => (
                    <article key={item.id} className="flex gap-4 items-start">
                      <div className="flex-1 min-w-0">
                        <Link href={`/news/${item.id}`} className="group">
                          <h4 className="expert transition-colors duration-200">
                            {item.title}
                          </h4>
                        </Link>
                        {item.author && (
                          <p className="text-xs text-muted-foreground mt-2">
                            By{" "}
                            <span className="font-semibold text-foreground uppercase tracking-wide">{item.author}</span>
                          </p>
                        )}
                      </div>
                      <Link href={`/news/${item.id}`} className="group flex-shrink-0">
                        <div className="relative w-20 h-20 lg:w-24 lg:h-24 rounded overflow-hidden bg-muted">
                          <Image
                            src={item.image || "/placeholder.svg"}
                            alt={item.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-110"
                            sizes="96px"
                          />
                        </div>
                      </Link>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {/* Opinion Section - 2 Column Grid */}
            {sidebarOpinion && (
              <section className="pb-10 border-b border-border">
                <div className="mb-8">
                  <span className="text-sm font-bold text-primary uppercase tracking-wider">Opinion</span>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-6">
                    {sidebarOpinion.left.map((article) => (
                      <article key={article.id}>
                        <Link href={`/news/${article.id}`} className="group">
                          <h4 className="font-serif text-sm lg:text-base font-bold leading-tight text-foreground group-hover:text-primary transition-colors duration-200">
                            {article.title}
                          </h4>
                        </Link>
                      </article>
                    ))}
                  </div>
                  {/* Right Column */}
                  <div className="space-y-6">
                    {sidebarOpinion.right.map((article) => (
                      <article key={article.id}>
                        <Link href={`/news/${article.id}`} className="group">
                          <h4 className="font-serif text-sm lg:text-base font-bold leading-tight text-foreground group-hover:text-primary transition-colors duration-200">
                            {article.title}
                          </h4>
                        </Link>
                      </article>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Advertisement Space - SMARTMAG */}
            <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-red-600 via-red-700 to-red-900 p-8 lg:p-10 text-white text-center shadow-xl">
              <div className="relative z-10 space-y-6">
                <p className="text-xs font-bold uppercase tracking-widest opacity-90">The New</p>
                <h3 className="text-4xl lg:text-5xl font-bold tracking-tight">BAWAL NEWS</h3>
                <p className="text-sm opacity-90 max-w-[200px] mx-auto">
                  Trusted by over <span className="font-bold">16000</span> users worldwide
                </p>
                <button className="inline-block bg-white text-red-600 px-8 py-3 rounded-full font-bold text-sm uppercase tracking-wide hover:bg-gray-100 hover:shadow-lg transition-all duration-200 transform hover:scale-105">
                  Get Started
                </button>
              </div>
              {/* Decorative background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
