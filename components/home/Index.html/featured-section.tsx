import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import type { Article } from "@/constants/news-data"

interface FeaturedSectionProps {
  mainFeatured: Article | null
  middleFeatured: Article[]
  rightTopFeatured: Article | null
  rightListMostViewed: Article[]
  breakingNews: Article[]
}

export function FeaturedSection({
  mainFeatured,
  middleFeatured,
  rightTopFeatured,
  rightListMostViewed,
  breakingNews,
}: FeaturedSectionProps) {
  return (
    <section className="container mx-auto px-4">
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-12">
        {/* Left Column: Main Feature (50%) */}
        <div className="lg:col-span-6">
          <div className="mb-2 flex items-center gap-2">
            <Badge className="rounded bg-blue-500 px-2 py-0.5 text-xs font-bold uppercase text-white hover:bg-blue-600">
              Live Updates
            </Badge>
            <span className="text-xs text-muted-foreground">Updated: {mainFeatured?.date || ""}</span>
          </div>

          <Link href={`/news/${mainFeatured?.slug || "#"}`} className="group block">
            <h2 className="mb-4 feature-section-font ">
              {mainFeatured?.title || ""}
            </h2>

            <div className="relative mb-4 aspect-[16/10] w-full overflow-hidden rounded">
              <Image
                src={mainFeatured?.image || "/placeholder.svg"}
                alt={mainFeatured?.title || ""}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </div>

            <p className="mb-8 expert">
              {mainFeatured?.excerpt || ""}
            </p>
          </Link>

          {/* News Just In */}
          <div className="border-t border-border pt-4">
            <h4  className="mb-4 text-sm font-bold uppercase tracking-wider text-orange-500">News Just In</h4>
            <ul className="space-y-2">
              {breakingNews.slice(0, 4).map((item) => (
                <li key={item.id} className="flex items-start gap-3">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-blue-500" />
                  <Link
                    href={`/news/${item.slug}`}
                    className="font-serif text-sm font-medium leading-snug hover:text-blue-600 hover:underline"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Middle Column: Vertical Stack (25%) */}
        <div className="flex flex-col gap-6 border-l border-border/20 lg:col-span-3 lg:border-l lg:pl-4">
          {middleFeatured.map((article, index) => {
            const isFirst = index === 0;
            const isLast = index === middleFeatured.length - 1;
            const isMiddle = !isFirst && !isLast;
            
            return (
              <div key={article.id} className={index !== 0 ? "border-t border-border pt-4" : ""}>
                <Link href={`/news/${article.slug}`} className="group block">
                  {/* Show image only for first and last items */}
                  {(isFirst || isLast) && article.image && (
                    <div className="relative mb-2 aspect-[3/2] w-full overflow-hidden rounded-sm">
                      <Image
                        src={article.image || "/placeholder.svg"}
                        alt={article.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 25vw"
                      />
                    </div>
                  )}
                  <h3 className="mb-2 font-serif text-xl font-bold leading-tight group-hover:text-blue-600">
                    {article.title}
                  </h3>
                  {/* Show excerpt only for first item (not middle or last) */}
                  {isFirst && article.excerpt && (
                    <h4 className="line-clamp-3 leading-relaxed text-muted-foreground">{article.excerpt}</h4>
                  )}
                </Link>
              </div>
            );
          })}
        </div>

        {/* Right Column: Sidebar (25%) */}
        <div className="flex flex-col gap-6 border-l border-border/20 lg:col-span-3 lg:border-l lg:pl-6">
          {/* Top Article */}
          <Link href={`/news/${rightTopFeatured?.slug || "#"}`} className="group block border-b border-border pb-6">
            <div className="relative mb-3 aspect-[3/2] w-full overflow-hidden rounded-sm">
              <Image
                src={rightTopFeatured?.image || "/placeholder.svg"}
                alt={rightTopFeatured?.title || ""}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 25vw"
              />
            </div>
            <h3 className="font-serif text-xl font-bold leading-tight group-hover:text-blue-600">
              {rightTopFeatured?.title || ""}
            </h3>
          </Link>

          {/* List Items */}
          <div className="flex flex-col gap-6">
            {rightListMostViewed.map((item) => (
              <Link key={item.id} href={`/news/${item.slug}`} className="group grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <h4 className="font-serif text-sm font-bold leading-snug group-hover:text-blue-600">{item.title}</h4>
                </div>
                <div className="col-span-1">
                  <div className="relative aspect-square w-full overflow-hidden rounded-sm">
                    <Image
                      src={item.image || "/placeholder.svg"}
                      alt={item.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 8vw"
                    />
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
