"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy, Download, X, Check } from "lucide-react"
import { formatDate, formatBytes } from "@/lib/utils"
import { OptimizedImage } from "@/components/ui/optimized-image"
import { useState } from "react"

interface Media {
  id: string
  name: string
  url: string
  publicId: string
  format: string
  resourceType: "image" | "video" | "raw"
  bytes: number | null
  width: number | null
  height: number | null
  duration: number | null
  folder: string | null
  tags: string[]
  uploader: {
    id: string
    username: string
    email: string
    firstName: string | null
    lastName: string | null
  }
  createdAt: Date
}

interface MediaDetailCardProps {
  media: Media
  onClose: () => void
}

export function MediaDetailCard({ media, onClose }: MediaDetailCardProps) {
  const [copied, setCopied] = useState(false)

  const copyUrl = async () => {
    // For production, you might want to prepend your domain
    const fullUrl = typeof window !== "undefined" ? `${window.location.origin}${media.url}` : media.url
    await navigator.clipboard.writeText(fullUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col md:flex-row">
      {/* Image Preview */}
      <div className="relative flex-1 bg-muted/30 min-h-[300px] md:min-h-[400px]">
        {media.resourceType === "image" ? (
          <OptimizedImage
            src={media.url}
            alt={media.name}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            Preview not available
          </div>
        )}
      </div>

      {/* Details Panel */}
      <div className="w-full md:w-[350px] p-6 space-y-6 border-t md:border-t-0 md:border-l">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg truncate max-w-[250px]" title={media.name}>
              {media.name}
            </h3>
            <p className="text-sm text-muted-foreground">{formatDate(media.createdAt)}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Format</p>
              <Badge variant="secondary" className="mt-1 uppercase">{media.format}</Badge>
            </div>
            <div>
              <p className="text-muted-foreground">Size</p>
              <p className="font-medium">{formatBytes(media.bytes || 0)}</p>
            </div>
            {media.width && media.height && (
              <div>
                <p className="text-muted-foreground">Dimensions</p>
                <p className="font-medium">{media.width} × {media.height}</p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground">Type</p>
              <p className="font-medium capitalize">{media.resourceType}</p>
            </div>
          </div>

          {media.folder && (
            <div className="text-sm">
              <p className="text-muted-foreground">Folder</p>
              <p className="font-medium">{media.folder}</p>
            </div>
          )}

          {media.tags && media.tags.length > 0 && (
            <div className="text-sm">
              <p className="text-muted-foreground mb-2">Tags</p>
              <div className="flex flex-wrap gap-1">
                {media.tags.map((tag, i) => (
                  <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                ))}
              </div>
            </div>
          )}

          <div className="text-sm">
            <p className="text-muted-foreground">Uploaded by</p>
            <p className="font-medium">
              {media.uploader.firstName || media.uploader.lastName
                ? `${media.uploader.firstName || ""} ${media.uploader.lastName || ""}`.trim()
                : media.uploader.username}
            </p>
          </div>

          <div className="text-sm">
            <p className="text-muted-foreground mb-2">URL</p>
            <div className="flex gap-2">
              <code className="flex-1 text-xs bg-muted p-2 rounded truncate">{media.url}</code>
              <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={copyUrl}>
                {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button className="flex-1" onClick={() => window.open(media.url, "_blank")}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>
    </div>
  )
}
