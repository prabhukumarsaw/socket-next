import { Suspense } from "react"
import { getCurrentUser } from "@/lib/auth/jwt"
import { checkPermission } from "@/lib/auth/permissions"
import { getUserMedia } from "@/lib/actions/media"
import { redirect } from "next/navigation"
import { MediaTable } from "@/components/media/media-table"
import { MediaUploader } from "@/components/media/media-uploader"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import PageContainer from "@/components/layout/page-container"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { ImageIcon, UploadCloud } from "lucide-react"

/**
 * Media Management Page
 * Shows user's own media files (or all files if has media.read.all permission)
 */
export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; type?: string; view?: string }>
}) {
  // In a real app, you might want to wrap this in a try/catch or handle null users gracefully
  // For now, we follow the provided logic
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  // Check if user has media.upload permission
  const hasUploadAccess = await checkPermission("media.upload")
  if (!hasUploadAccess) {
    redirect("/dashboard")
  }

  const params = await searchParams
  const page = Number.parseInt(params.page || "1")
  const search = params.search
  const viewMode = (params.view as "grid" | "list") || "grid"

  const filters: any = {}
  if (params.type) {
    filters.resourceType = params.type as "image" | "video" | "raw"
  }

  // Fetch data
  const result = await getUserMedia(page, 20, search, filters)

  return (
    <PageContainer>
      <div className="flex flex-col space-y-6 p-4 md:p-8 pt-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Media Library</h1>
          <p className="text-muted-foreground">Manage your media assets, upload files, and organize your content.</p>
        </div>
        <Separator />

        <Tabs defaultValue="library" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
              <TabsTrigger value="library" className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Library
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <UploadCloud className="h-4 w-4" />
                Upload
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="library" className="space-y-4 animate-in fade-in-50 duration-300">
            {!result.success ? (
              <div className="rounded-md bg-destructive/10 p-6 text-destructive border border-destructive/20">
                <p className="font-semibold">Error loading media</p>
                <p className="text-sm opacity-90">{result.error}</p>
              </div>
            ) : (
              <Suspense fallback={<MediaTableSkeleton />}>
                <MediaTable
                  media={result.media}
                  total={result.total}
                  page={result.page}
                  totalPages={result.totalPages}
                  search={search}
                  viewMode={viewMode}
                />
              </Suspense>
            )}
          </TabsContent>

          <TabsContent value="upload" className="animate-in fade-in-50 duration-300">
            <div className="max-w-2xl mx-auto">
              <MediaUploader />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  )
}

function MediaTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <Skeleton className="h-10 w-[250px]" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-lg" />
        ))}
      </div>
    </div>
  )
}
