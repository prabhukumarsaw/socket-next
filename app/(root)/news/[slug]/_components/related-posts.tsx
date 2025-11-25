import Image from "next/image"
import Link from "next/link"
import type { Article } from "@/constants/news-data"

interface RelatedPostsProps {
  posts: Article[]
}

export function RelatedPosts({ posts }: RelatedPostsProps) {
  if (!posts.length) return null

  return (
    <div className="mb-12 border-t border-border pt-8">
      <h3 className="text-xl font-bold mb-6 uppercase border-b border-blue-500 inline-block pb-1 text-blue-600">
        Related Posts
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {posts.map((post) => (
          <Link href={`/news/${post.slug}`} key={post.id} className="group block h-full">
            <div className="flex flex-col h-full">
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg mb-3">
                <Image
                  src={post.image || "/placeholder.svg?height=300&width=480"}
                  alt={post.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <h4 className="font-bold text-md mb-2 group-hover:text-blue-600 transition-colors line-clamp-3 leading-snug">
                {post.title}
              </h4>
              <div className="mt-auto text-xs text-muted-foreground">{post.date}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
