"use client"

import Image from "next/image"
import Link from "next/link"
import { MessageCircle, Clock, Share2 } from "lucide-react"
import type { Article } from "@/constants/news-data"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { shareOnFacebook, shareOnTwitter, shareOnLinkedIn, shareOnPinterest } from "@/lib/utils/share"

interface ArticleHeaderProps {
  article: Article
}

export function ArticleHeader({ article }: ArticleHeaderProps) {
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/news/${article.slug}` : ""
  const shareData = {
    url: shareUrl,
    title: article.title,
    description: article.excerpt,
    image: article.image,
  }
  return (
    <div className="mb-8">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-muted-foreground mb-4 overflow-x-auto whitespace-nowrap">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <span className="mx-2">»</span>
        <Link href={`/news/${article.category}`} className="hover:text-foreground capitalize">
          {article.category}
        </Link>
        <span className="mx-2">»</span>
        <span className="text-foreground truncate max-w-[300px]">{article.title}</span>
      </div>

      {/* Category Badge */}
      <Badge variant="default" className="mb-4 bg-blue-500 hover:bg-blue-600 text-white uppercase rounded-sm">
        {article.category}
      </Badge>

      {/* Title */}
      <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-6 text-foreground">{article.title}</h1>

      {/* Excerpt */}
      <p className="text-xl text-muted-foreground mb-6 leading-relaxed">{article.excerpt}</p>

      {/* Meta Data Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-b border-border py-4 mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 rounded-full overflow-hidden bg-muted">
            <Image src="/author-avatar.png" alt={article.author} fill className="object-cover" />
          </div>
          <div className="flex flex-col text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground uppercase text-xs font-bold">BY</span>
              <span className="font-bold text-foreground uppercase">{article.author}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <span>{article.date}</span>
              {article.updatedDate && <span>• Updated: {article.updatedDate}</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <MessageCircle className="h-4 w-4" />
            <span>{article.comments} Comments</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{article.readTime}</span>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          <span className="font-bold text-sm mr-2 flex items-center gap-1 shrink-0">
            <Share2 className="h-4 w-4" /> Share
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => shareOnFacebook(shareData)}
            className="h-9 w-9 md:h-8 md:w-8 shrink-0 rounded-full text-blue-600 border-blue-200 hover:bg-blue-50 bg-transparent"
          >
            <span className="sr-only">Facebook</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
            </svg>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => shareOnTwitter(shareData)}
            className="h-9 w-9 md:h-8 md:w-8 shrink-0 rounded-full text-sky-500 border-sky-200 hover:bg-sky-50 bg-transparent"
          >
            <span className="sr-only">Twitter</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
            </svg>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => shareOnPinterest(shareData)}
            className="h-9 w-9 md:h-8 md:w-8 shrink-0 rounded-full text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
          >
            <span className="sr-only">Pinterest</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M8 20l4-9" />
              <path d="M10.7 13c.43-.9 1.6-1.2 2.3-.6C13.9 13.1 14 15 14 15c0 1.1-.9 1.9-2 1.9-2 0-2.5-2.5-1-4.4.9-1.2 2.5-.9 3 .2.5 1.1.2 2.4-.4 3.5" />
            </svg>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => shareOnLinkedIn(shareData)}
            className="h-9 w-9 md:h-8 md:w-8 shrink-0 rounded-full text-blue-700 border-blue-200 hover:bg-blue-50 bg-transparent"
          >
            <span className="sr-only">LinkedIn</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
              <rect width="4" height="12" x="2" y="9" />
              <circle cx="4" cy="4" r="2" />
            </svg>
          </Button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none gap-2 text-xs h-9 sm:h-8 bg-transparent w-full justify-center"
          >
            <span className="font-semibold">Follow Us</span>
            <Image src="/news-icon.png" alt="News" width={16} height={16} className="rounded-sm" />
          </Button>
        </div>
      </div>

      {/* Main Image */}
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg shadow-md mb-8">
        <Image
          src={article.image || "/placeholder.svg?height=600&width=1200"}
          alt={article.title}
          fill
          className="object-cover hover:scale-105 transition-transform duration-700"
          priority
        />
      </div>
    </div>
  )
}
