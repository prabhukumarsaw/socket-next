"use client"

import { useState, useEffect } from "react"
import { X, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface BreakingNews {
  id: string
  title: string
  slug: string
}

interface BreakingNewsTickerProps {
  news: BreakingNews[]
  onClose?: () => void
  className?: string
}

export function BreakingNewsTicker({ news, onClose, className }: BreakingNewsTickerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (news.length === 0 || isPaused || !isVisible) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % news.length)
    }, 5000) // Change news every 5 seconds

    return () => clearInterval(interval)
  }, [news.length, isPaused, isVisible])

  if (!isVisible || news.length === 0) return null

  const currentNews = news[currentIndex]

  return (
    <div
      className={cn(
        "relative w-full bg-red-600 text-white py-3 px-4 overflow-hidden",
        className
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="container mx-auto flex items-center gap-4">
        {/* Breaking News Label */}
        <div className="flex items-center gap-2 shrink-0 bg-red-700 px-3 py-1 rounded font-bold text-sm uppercase tracking-wider">
          <span className="animate-pulse">🔴</span>
          <span>Breaking</span>
        </div>

        {/* Ticker Content */}
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center gap-2 animate-slide">
            <ChevronRight className="h-4 w-4 shrink-0" />
            <Link
              href={`/news/${currentNews.slug}`}
              className="hover:underline font-semibold text-sm md:text-base line-clamp-1"
            >
              {currentNews.title}
            </Link>
          </div>
        </div>

        {/* Navigation Dots */}
        {news.length > 1 && (
          <div className="hidden md:flex items-center gap-1 shrink-0">
            {news.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  index === currentIndex
                    ? "bg-white w-6"
                    : "bg-white/50 hover:bg-white/75"
                )}
                aria-label={`Go to news ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Close Button */}
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setIsVisible(false)
              onClose()
            }}
            className="h-6 w-6 shrink-0 text-white hover:bg-red-700 hover:text-white"
            aria-label="Close breaking news"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <style jsx>{`
        @keyframes slide {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(-100%);
          }
        }
        .animate-slide {
          animation: slide 20s linear infinite;
        }
      `}</style>
    </div>
  )
}

