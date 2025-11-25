"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export default function ArticleError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-6">
      <div className="bg-red-100 dark:bg-red-900/20 p-4 rounded-full">
        <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-400" />
      </div>
      <div className="space-y-2 max-w-md">
        <h2 className="text-2xl font-bold">Failed to load article</h2>
        <p className="text-muted-foreground">
          We encountered an error while loading this article. It might have been removed or is temporarily unavailable.
        </p>
      </div>
      <div className="flex gap-4">
        <Button onClick={() => reset()} variant="outline">
          Try again
        </Button>
        <Button asChild>
          <Link href="/">Return Home</Link>
        </Button>
      </div>
    </div>
  )
}
