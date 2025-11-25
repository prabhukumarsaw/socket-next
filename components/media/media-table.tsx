"use client"

import type React from "react"

import { useState, useTransition } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Trash2, Download, ImageIcon, Video, FileIcon, Eye, LayoutGrid, ListIcon, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { deleteMedia } from "@/lib/actions/media"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatDate, formatBytes } from "@/lib/utils"
import { OptimizedImage } from "@/components/ui/optimized-image"
import { MediaDetailCard } from "./media-detail-card"
import { cn } from "@/lib/utils"

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

interface MediaTableProps {
  media: Media[]
  total: number
  page: number
  totalPages: number
  search?: string
  viewMode?: "grid" | "list"
}

export function MediaTable({
  media,
  total,
  page,
  totalPages,
  search: initialSearch,
  viewMode = "grid",
}: MediaTableProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [search, setSearch] = useState(initialSearch || "")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [mediaToDelete, setMediaToDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null)
  const [isPending, startTransition] = useTransition()

  const updateUrl = (newParams: Record<string, string>) => {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (viewMode) params.set("view", viewMode)
    params.set("page", page.toString())
    Object.entries(newParams).forEach(([key, value]) => {
      params.set(key, value)
    })
    startTransition(() => {
      router.push(`/dashboard/media?${params.toString()}`)
    })
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
      toast({ title: "Media deleted", description: "The media file has been successfully deleted." })
      router.refresh()
    } else {
      toast({ title: "Error", description: result.error || "Failed to delete media", variant: "destructive" })
    }
  }

  const getResourceIcon = (resourceType: string) => {
    switch (resourceType) {
      case "image": return <ImageIcon className="h-6 w-6 text-muted-foreground" />
      case "video": return <Video className="h-6 w-6 text-muted-foreground" />
      default: return <FileIcon className="h-6 w-6 text-muted-foreground" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-card p-4 rounded-lg border shadow-sm">
        <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-[300px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search media..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-full" />
          </div>
          <Button type="submit" variant="secondary" disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
          </Button>
        </form>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="flex items-center border rounded-md p-1 bg-background">
            <Button variant="ghost" size="sm" className={cn("h-8 px-2", viewMode === "grid" && "bg-muted")} onClick={() => updateUrl({ view: "grid" })}>
              <LayoutGrid className="h-4 w-4 mr-2" />Grid
            </Button>
            <Button variant="ghost" size="sm" className={cn("h-8 px-2", viewMode === "list" && "bg-muted")} onClick={() => updateUrl({ view: "list" })}>
              <ListIcon className="h-4 w-4 mr-2" />List
            </Button>
          </div>
        </div>
      </div>

      <div className={cn("relative min-h-[200px]", isPending && "opacity-50 transition-opacity")}>
        {media.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-lg bg-muted/50">
            <div className="bg-background p-4 rounded-full mb-4"><ImageIcon className="h-8 w-8 text-muted-foreground" /></div>
            <h3 className="text-lg font-semibold">No media found</h3>
            <p className="text-muted-foreground max-w-xs mt-1">{search ? "Try adjusting your search terms" : "Upload your first file to get started"}</p>
            {search && <Button variant="link" onClick={() => { setSearch(""); updateUrl({ search: "", page: "1" }) }} className="mt-2">Clear search</Button>}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {media.map((item) => (
              <div key={item.id} className="group relative bg-card border rounded-xl overflow-hidden hover:shadow-md transition-all duration-200 hover:border-primary/50">
                <div className="cursor-pointer aspect-square relative overflow-hidden bg-muted/30" onClick={() => { setSelectedMedia(item); setDetailDialogOpen(true) }}>
                  {item.resourceType === "image" ? (
                    <OptimizedImage src={item.url} alt={item.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">{getResourceIcon(item.resourceType)}</div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                    <Button variant="secondary" size="icon" className="h-9 w-9 rounded-full shadow-sm" onClick={(e) => { e.stopPropagation(); setSelectedMedia(item); setDetailDialogOpen(true) }} title="View details"><Eye className="h-4 w-4" /></Button>
                    <Button variant="destructive" size="icon" className="h-9 w-9 rounded-full shadow-sm" onClick={(e) => { e.stopPropagation(); setMediaToDelete(item.id); setDeleteDialogOpen(true) }} title="Delete"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                <div className="p-3 space-y-1.5">
                  <p className="text-sm font-medium truncate leading-none" title={item.name}>{item.name}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatBytes(item.bytes || 0)}</span>
                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal uppercase">{item.format}</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-[100px]">Preview</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Dimensions</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {media.map((item) => (
                  <TableRow key={item.id} className="group">
                    <TableCell>
                      <div className="cursor-pointer relative w-12 h-12 rounded-md overflow-hidden bg-muted border" onClick={() => { setSelectedMedia(item); setDetailDialogOpen(true) }}>
                        {item.resourceType === "image" ? <OptimizedImage src={item.url} alt={item.name} fill className="object-cover" sizes="48px" /> : <div className="w-full h-full flex items-center justify-center">{getResourceIcon(item.resourceType)}</div>}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium"><div className="flex flex-col max-w-[200px]"><span className="truncate" title={item.name}>{item.name}</span>{item.folder && <span className="text-xs text-muted-foreground truncate">{item.folder}</span>}</div></TableCell>
                    <TableCell><Badge variant="outline" className="uppercase text-xs">{item.format}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{formatBytes(item.bytes || 0)}</TableCell>
                    <TableCell className="text-muted-foreground">{item.width && item.height ? `${item.width} × ${item.height}` : "-"}</TableCell>
                    <TableCell><span className="text-sm">{item.uploader.firstName || item.uploader.lastName ? `${item.uploader.firstName || ""} ${item.uploader.lastName || ""}`.trim() : item.uploader.username}</span></TableCell>
                    <TableCell className="text-muted-foreground text-sm whitespace-nowrap">{formatDate(item.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedMedia(item); setDetailDialogOpen(true) }}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.open(item.url, "_blank")}><Download className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => { setMediaToDelete(item.id); setDeleteDialogOpen(true) }}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1 || isPending} onClick={() => updateUrl({ page: (page - 1).toString() })}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages || isPending} onClick={() => updateUrl({ page: (page + 1).toString() })}>Next</Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Media</DialogTitle>
            <DialogDescription>Are you sure you want to delete this media file? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>{deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto p-0 gap-0">
          {selectedMedia && <MediaDetailCard media={selectedMedia} onClose={() => setDetailDialogOpen(false)} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
