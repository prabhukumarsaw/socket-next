"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Facebook, Linkedin, Mail, Twitter } from "lucide-react"
import { cn } from "@/lib/utils"
import { shareOnFacebook, shareOnTwitter, shareOnLinkedIn, shareViaEmail, copyToClipboard } from "@/lib/utils/share"
import { toast } from "sonner"

export function SocialSidebar() {
  const [shareData, setShareData] = useState({
    url: "",
    title: "",
    description: "",
  })
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Get article data from page
    const articleTitle = document.querySelector("h1")?.textContent || ""
    const articleExcerpt = document.querySelector("p")?.textContent || ""
    const currentUrl = window.location.href

    setShareData({
      url: currentUrl,
      title: articleTitle,
      description: articleExcerpt,
    })

    const handleScroll = () => {
      // Show after scrolling past the hero image (approx 400px)
      const scrolled = window.scrollY > 300
      setIsVisible(scrolled)
    }

    // Initial check
    handleScroll()

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div
      className={cn(
        "flex flex-col gap-6 items-center w-12 pt-2 transition-opacity duration-500 ease-in-out",
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none",
      )}
    >
      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest writing-vertical-rl transform rotate-180">
        SHARE
      </span>

      <div className="flex flex-col gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => shareOnFacebook(shareData)}
          className="h-10 w-10 rounded-full bg-background shadow-sm text-blue-600 border-blue-100 hover:bg-blue-50 transition-transform hover:scale-110"
          aria-label="Share on Facebook"
        >
          <Facebook className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => shareOnTwitter(shareData)}
          className="h-10 w-10 rounded-full bg-background shadow-sm text-sky-500 border-sky-100 hover:bg-sky-50 transition-transform hover:scale-110"
          aria-label="Share on Twitter"
        >
          <Twitter className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => shareOnLinkedIn(shareData)}
          className="h-10 w-10 rounded-full bg-background shadow-sm text-blue-700 border-blue-100 hover:bg-blue-50 transition-transform hover:scale-110"
          aria-label="Share on LinkedIn"
        >
          <Linkedin className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-full bg-background shadow-sm text-red-600 border-red-100 hover:bg-red-50 transition-transform hover:scale-110"
          aria-label="Share on Pinterest"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M8 20l4-9" />
            <path d="M10.7 13c.43-.9 1.6-1.2 2.3-.6C13.9 13.1 14 15 14 15c0 1.1-.9 1.9-2 1.9-2 0-2.5-2.5-1-4.4.9-1.2 2.5-.9 3 .2.5 1.1.2 2.4-.4 3.5" />
          </svg>
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => shareViaEmail(shareData)}
          className="h-10 w-10 rounded-full bg-background shadow-sm text-gray-600 border-gray-200 hover:bg-gray-50 transition-transform hover:scale-110"
          aria-label="Share via Email"
        >
          <Mail className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={async () => {
            const success = await copyToClipboard(shareData.url)
            if (success) {
              toast.success("Link copied to clipboard!")
            } else {
              toast.error("Failed to copy link")
            }
          }}
          className="h-10 w-10 rounded-full bg-background shadow-sm text-gray-600 border-gray-200 hover:bg-gray-50 transition-transform hover:scale-110"
          aria-label="Copy link"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
            <path d="M4 16c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2" />
          </svg>
        </Button>
      </div>
    </div>
  )
}
