"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { OptimizedImage } from "@/components/ui/optimized-image"
import { MediaUploader } from "./media-uploader"
import { deleteMedia } from "@/lib/actions/media"
import { useToast } from "@/hooks/use-toast"
import { formatDate, formatBytes, cn } from "@/lib/utils"
import {
  Search, Trash2, Download, ImageIcon, Video, FileIcon, Eye, LayoutGrid, List,
  Loader2, Upload, FolderOpen, Clock, HardDrive, Copy, Check, X, Filter, SlidersHorizontal
} from "lucide-react"

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
  folder: string | null
  tags: string[]
  uploader: { id: string; username: string; email: string; firstName: string | null; lastName: string | null }
  createdAt: Date | string // Accept both Date (server) and string (serialized)
}

interface MediaLibraryProps {
  media: Media[]
  total: number
  page: number
  totalPages: number
  search?: string
  viewMode?: "grid" | "list"
  error?: string
}

export function MediaLibrary({ media, total, page, totalPages, search: initialSearch, viewMode = "grid", error }: any) {
  const router = useRouter()
  const { toast } = useToast()
  const [search, setSearch] = useState(initialSearch || "")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [mediaToDelete, setMediaToDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [copied, setCopied] = useState(false)

  const updateUrl = (params: Record<string, string>) => {
    const urlParams = new URLSearchParams()
    if (search) urlParams.set("search", search)
    urlParams.set("view", viewMode)
    urlParams.set("page", page.toString())
    Object.entries(params).forEach(([k, v]) => urlParams.set(k, v))
    startTransition(() => router.push(`/dashboard/media?${urlParams.toString()}`))
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateUrl({ search, page: "1" })
  }

  const handleDelete = async () => {
    if (!mediaToDelete) return
    setDeleting(true)
    const result = await deleteMedia(mediaToDelete)
    setDeleting(false)
    setDeleteDialogOpen(false)
    setMediaToDelete(null)
    if (result.success) {
      toast({ title: "Deleted", description: "Media file removed successfully." })
      router.refresh()
    } else {
      toast({ title: "Error", description: result.error || "Failed to delete", variant: "destructive" })
    }
  }

  const copyUrl = async (url: string) => {
    const fullUrl = typeof window !== "undefined" ? `${window.location.origin}${url}` : url
    await navigator.clipboard.writeText(fullUrl)
    setCopied(true)
    toast({ title: "Copied!", description: "URL copied to clipboard" })
    setTimeout(() => setCopied(false), 2000)
  }

  const getIcon = (type: string) => {
    if (type === "image") return <ImageIcon className="h-5 w-5" />
    if (type === "video") return <Video className="h-5 w-5" />
    return <FileIcon className="h-5 w-5" />
  }

  // Stats
  const totalSize = media.reduce((acc:any, m:any) => acc + (m.bytes || 0), 0)
  // const imageCount = media.filter(m => m.resourceType === "image").length

  if (error) {
    return (
      <div className="p-8">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <p className="text-destructive font-medium">Error loading media: {error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen w-full">
      {/* Header */}
      <div className="border-b bg-gradient-to-r from-background to-muted/30 w-full">
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Media Library
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage, upload and organize your media assets
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <HardDrive className="h-4 w-4" />
                  <span>{formatBytes(totalSize)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ImageIcon className="h-4 w-4" />
                  <span>{total} files</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="library" className="flex-1">
        <div className="border-b px-6 md:px-8">
          <TabsList className="h-12 bg-transparent p-0 gap-4">
            <TabsTrigger value="library" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1 pb-3">
              <FolderOpen className="h-4 w-4 mr-2" />
              Library
            </TabsTrigger>
            <TabsTrigger value="upload" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1 pb-3">
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="library" className="mt-0 flex-1">
          <div className="p-6 md:p-8 space-y-6">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, folder..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 h-10"
                  />
                </div>
                <Button type="submit" variant="secondary" size="icon" className="h-10 w-10" disabled={isPending}>
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </form>

              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-lg border p-1 bg-muted/50">
                  <Button
                    variant="ghost" size="sm"
                    className={cn("h-8 px-3", viewMode === "grid" && "bg-background shadow-sm")}
                    onClick={() => updateUrl({ view: "grid" })}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost" size="sm"
                    className={cn("h-8 px-3", viewMode === "list" && "bg-background shadow-sm")}
                    onClick={() => updateUrl({ view: "list" })}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Content */}
            {media.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="rounded-full bg-muted p-4 mb-4">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold">No media found</h3>
                  <p className="text-muted-foreground text-center max-w-sm mt-1">
                    {search ? "Try different search terms" : "Upload your first file to get started"}
                  </p>
                </CardContent>
              </Card>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {media.map((item:any) => (
                  <div
                    key={item.id}
                    className="group relative bg-card border rounded-xl overflow-hidden hover:shadow-lg hover:border-primary/50 transition-all duration-200 cursor-pointer"
                    onClick={() => { setSelectedMedia(item); setDetailOpen(true) }}
                  >
                    <div className="aspect-square relative bg-background w-full">
                      {item.resourceType === "image" ? (
                        <OptimizedImage 
                          src={item.url} 
                          alt={item.name} 
                          fill 
                          className="object-cover" 
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                        />
                      ) : (
                        <div className="absolute inset-0 w-full h-full flex items-center justify-center text-muted-foreground bg-muted/50">
                          {getIcon(item.resourceType)}
                        </div>
                      )}
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button variant="secondary" size="icon" className="h-9 w-9 rounded-full" onClick={(e) => { e.stopPropagation(); setSelectedMedia(item); setDetailOpen(true) }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="secondary" size="icon" className="h-9 w-9 rounded-full" onClick={(e) => { e.stopPropagation(); copyUrl(item.url) }}>
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <Button variant="destructive" size="icon" className="h-9 w-9 rounded-full" onClick={(e) => { e.stopPropagation(); setMediaToDelete(item.id); setDeleteDialogOpen(true) }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-muted-foreground">{formatBytes(item.bytes || 0)}</span>
                        <Badge variant="secondary" className="text-[10px] h-5 uppercase">{item.format}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Card>
                <div className="divide-y">
                  {media.map((item:any) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors group">
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-background shrink-0">
                        {item.resourceType === "image" ? (
                          <OptimizedImage src={item.url} alt={item.name} fill className="object-cover" sizes="64px" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted/50">{getIcon(item.resourceType)}</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.name}</p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          <span>{formatBytes(item.bytes || 0)}</span>
                          {item.width && item.height && <span>{item.width}×{item.height}</span>}
                          <span>{formatDate(item.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedMedia(item); setDetailOpen(true) }}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyUrl(item.url)}><Copy className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.open(item.url, "_blank")}><Download className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setMediaToDelete(item.id); setDeleteDialogOpen(true) }}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-muted-foreground">Page {page} of {totalPages} • {total} total files</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page === 1 || isPending} onClick={() => updateUrl({ page: (page - 1).toString() })}>Previous</Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages || isPending} onClick={() => updateUrl({ page: (page + 1).toString() })}>Next</Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="upload" className="mt-0 flex-1">
          <div className="p-6 md:p-8 max-w-4xl mx-auto w-full">
            <MediaUploader />
          </div>
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Media Details</DialogTitle>
          </DialogHeader>
          {selectedMedia && (
            <div className="flex flex-col md:flex-row">
              <div className="flex-1 bg-background min-h-[300px] md:min-h-[450px] relative w-full">
                {selectedMedia.resourceType === "image" ? (
                  <OptimizedImage src={selectedMedia.url} alt={selectedMedia.name} fill className="object-contain" sizes="50vw" />
                ) : (
                  <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-muted/50">{getIcon(selectedMedia.resourceType)}</div>
                )}
              </div>
              <div className="w-full md:w-[320px] p-6 space-y-6 border-t md:border-t-0 md:border-l">
                <div className="flex items-start justify-between">
                  <div className="pr-4">
                    <h3 className="font-semibold truncate max-w-[200px]">{selectedMedia.name}</h3>
                    <p className="text-sm text-muted-foreground">{formatDate(selectedMedia.createdAt)}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setDetailOpen(false)}><X className="h-4 w-4" /></Button>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-muted-foreground">Format</p><Badge variant="secondary" className="mt-1 uppercase">{selectedMedia.format}</Badge></div>
                  <div><p className="text-muted-foreground">Size</p><p className="font-medium">{formatBytes(selectedMedia.bytes || 0)}</p></div>
                  {selectedMedia.width && selectedMedia.height && <div><p className="text-muted-foreground">Dimensions</p><p className="font-medium">{selectedMedia.width}×{selectedMedia.height}</p></div>}
                  <div><p className="text-muted-foreground">Type</p><p className="font-medium capitalize">{selectedMedia.resourceType}</p></div>
                </div>
                {selectedMedia.folder && <div className="text-sm"><p className="text-muted-foreground">Folder</p><p className="font-medium">{selectedMedia.folder}</p></div>}
                <div className="text-sm">
                  <p className="text-muted-foreground mb-2">URL</p>
                  <div className="flex gap-2">
                    <code className="flex-1 text-xs bg-muted p-2 rounded truncate">{selectedMedia.url}</code>
                    <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => copyUrl(selectedMedia.url)}>
                      {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button className="flex-1" onClick={() => window.open(selectedMedia.url, "_blank")}><Download className="h-4 w-4 mr-2" />Download</Button>
                  <Button variant="destructive" size="icon" onClick={() => { setMediaToDelete(selectedMedia.id); setDeleteDialogOpen(true); setDetailOpen(false) }}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Media</DialogTitle>
            <DialogDescription>This action cannot be undone. The file will be permanently removed.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

