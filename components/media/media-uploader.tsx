"use client"

import { useState } from "react"
import { FileUploader } from "@/components/misc/file-uploader"
import { uploadMedia } from "@/lib/actions/media"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, CheckCircle2, XCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"

/**
 * Media Uploader Component
 * Handles file uploads to Cloudinary with enhanced UI
 */
export function MediaUploader() {
  const router = useRouter()
  const { toast } = useToast()
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [folder, setFolder] = useState("bawal-news/media")
  const [tags, setTags] = useState("")
  const [uploadResults, setUploadResults] = useState<{ success: number; failed: number } | null>(null)

  const handleUpload = async (filesToUpload: File[]) => {
    if (filesToUpload.length === 0) return

    setUploading(true)
    setProgress(10) // Start progress
    setUploadResults(null)

    const tagsArray = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)

    try {
      // Validate file sizes
      const maxSize = 10 * 1024 * 1024 // 10MB
      const invalidFiles = filesToUpload.filter((file) => file.size > maxSize)

      if (invalidFiles.length > 0) {
        const fileNames = invalidFiles.map((f) => f.name).join(", ")
        toast({
          title: "Files too large",
          description: `Some files exceed the 10MB limit: ${fileNames}`,
          variant: "destructive",
        })
        setUploading(false)
        return
      }

      // Calculate total progress steps
      const totalFiles = filesToUpload.length
      let completedFiles = 0

      // Process uploads sequentially to update progress more accurately
      const results = []
      for (const file of filesToUpload) {
        const result = await uploadMedia(file, folder || undefined, tagsArray.length > 0 ? tagsArray : undefined)
        results.push(result)
        completedFiles++
        setProgress(10 + (completedFiles / totalFiles) * 80) // Scale from 10% to 90%
      }

      setProgress(100)

      const successCount = results.filter((r) => r.success).length
      const failCount = results.length - successCount

      setUploadResults({ success: successCount, failed: failCount })

      if (successCount > 0) {
        toast({
          title: "Upload complete",
          description: `Successfully uploaded ${successCount} files.`,
        })
        setFiles([])
        // Don't reset tags/folder in case they want to upload more with same settings
        router.refresh()
      }

      if (failCount > 0) {
        toast({
          title: "Some uploads failed",
          description: `${failCount} files failed to upload.`,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred during upload",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      // Reset progress after a delay
      setTimeout(() => setProgress(0), 2000)
    }
  }

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Media
        </CardTitle>
        <CardDescription>
          Drag and drop files here or click to browse. Supports images, videos, and documents.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="folder">Destination Folder</Label>
            <Input
              id="folder"
              placeholder="e.g., content/blog/2024"
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              disabled={uploading}
            />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Optional • Defaults to "bawal-news/media"
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              placeholder="e.g., nature, featured, dark-mode"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              disabled={uploading}
            />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Optional • Comma separated</p>
          </div>
        </div>

        <div className="relative">
          <FileUploader
            value={files}
            onValueChange={setFiles}
            onUpload={handleUpload}
            accept={{
              "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
              "video/*": [".mp4", ".webm", ".mov"],
              "application/pdf": [".pdf"],
            }}
            maxSize={10 * 1024 * 1024}
            multiple
            disabled={uploading}
          />

          {uploading && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-10 rounded-lg border">
              <div className="w-1/2 space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>Uploading...</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </div>
          )}
        </div>

        {uploadResults && !uploading && (
          <Alert
            variant={uploadResults.failed > 0 ? "destructive" : "default"}
            className="animate-in fade-in-50 slide-in-from-top-2"
          >
            {uploadResults.failed > 0 ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            <AlertTitle>Upload Finished</AlertTitle>
            <AlertDescription>
              {uploadResults.success} files uploaded successfully.{" "}
              {uploadResults.failed > 0 && `${uploadResults.failed} files failed.`}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
