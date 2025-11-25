import Link from "next/link"
import Image from "next/image"
import { Share2 } from "lucide-react"
import type { Article } from "@/constants/news-data"
import { Button } from "@/components/ui/button"

interface NewsCardProps {
  article: Article
}

export function NewsCard({ article }: NewsCardProps) {
  return (
    <article className="group flex flex-col md:flex-row gap-6 p-6 border-b border-zinc-800 ">
      <div className="relative w-full md:w-64 h-48 md:h-40 flex-shrink-0 overflow-hidden rounded-lg">
      <Link
            href={`/news/${article.slug}`}
          >
        <Image
          src={article.image || "/placeholder.svg"}
          alt={article.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        </Link>
      </div>

      <div className="flex-1 flex flex-col justify-between min-h-[160px]">
        <div>
          <Link
            href={`/news/${article.slug}`}
            className="group-hover:text-blue-400 transition-colors"
          >
            <h2 className="text-xl md:text-2xl font-bold  leading-tight mb-2">{article.title}</h2>
          </Link>

          <div className="flex flex-wrap items-center text-xs text-zinc-400 mb-3 gap-2">
            <time dateTime={article.date}>{article.date}</time>
            <span className="w-1 h-1 rounded-full bg-zinc-600" />
            <span className="text-zinc-300">{article.source}</span>
            {article.author && (
              <>
                <span className="hidden sm:inline w-1 h-1 rounded-full bg-zinc-600" />
                <span className="hidden sm:inline">Edited by: {article.author}</span>
              </>
            )}
          </div>

          <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-base line-clamp-2 leading-relaxed">{article.excerpt}</p>
        </div>

        {/* <div className="flex justify-end mt-4 md:mt-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white h-8 px-4 text-xs gap-2"
          >
            <Share2 className="w-3 h-3" />
            Share
          </Button>
        </div> */}
      </div>
    </article>
  )
}
