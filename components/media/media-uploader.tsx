"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { uploadMedia } from "@/lib/actions/media"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  Upload, CheckCircle2, XCircle, Shield, ImageIcon, 
  CloudUpload, File, X, Loader2, FolderOpen, Tag
} from "lucide-react"
import { cn, formatBytes } from "@/lib/utils"

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/gif": [".gif"],
  "image/svg+xml": [".svg"],
}

interface FileWithPreview extends File {
  preview?: string
  status?: "pending" | "uploading" | "success" | "error"
  error?: string
}

export function MediaUploader() {
  const router = useRouter()
  const { toast } = useToast()
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [folder, setFolder] = useState("uploads")
  const [tags, setTags] = useState("")

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach((file) => {
        const errors = file.errors.map((e: any) => e.message).join(", ")
        toast({
          title: `${file.file.name} rejected`,
          description: errors,
          variant: "destructive",
        })
      })
    }

    // Add accepted files with preview
    const newFiles = acceptedFiles.map((file) => 
      Object.assign(file, {
        preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
        status: "pending" as const,
      })
    )
    setFiles((prev) => [...prev, ...newFiles])
  }, [toast])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ALLOWED_TYPES,
    maxSize: MAX_FILE_SIZE,
    disabled: uploading,
  })

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev]
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!)
      }
      newFiles.splice(index, 1)
      return newFiles
    })
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    setUploading(true)
    setProgress(0)

    const tagsArray = tags.split(",").map((t) => t.trim()).filter(Boolean)
    const totalFiles = files.length
    let completed = 0
    let successCount = 0

    // Update all files to uploading
    setFiles((prev) => prev.map((f) => ({ ...f, status: "uploading" as const })))

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      try {
        const result = await uploadMedia(file, folder || undefined, tagsArray.length > 0 ? tagsArray : undefined)
        
        setFiles((prev) => {
          const newFiles = [...prev]
          if (result.success) {
            newFiles[i] = { ...newFiles[i], status: "success" }
            successCount++
          } else {
            newFiles[i] = { ...newFiles[i], status: "error", error: result.error }
          }
          return newFiles
        })
      } catch (error: any) {
        setFiles((prev) => {
          const newFiles = [...prev]
          newFiles[i] = { ...newFiles[i], status: "error", error: error.message }
          return newFiles
        })
      }
      
      completed++
      setProgress((completed / totalFiles) * 100)
    }

    setUploading(false)

    if (successCount > 0) {
      toast({
        title: "Upload complete",
        description: `${successCount} of ${totalFiles} files uploaded successfully.`,
      })
      router.refresh()
      
      // Clear successful files after delay
      setTimeout(() => {
        setFiles((prev) => prev.filter((f) => f.status !== "success"))
        setProgress(0)
      }, 2000)
    }
  }

  const clearAll = () => {
    files.forEach((f) => f.preview && URL.revokeObjectURL(f.preview))
    setFiles([])
    setProgress(0)
  }

  return (
    <div className="space-y-6">
      {/* Info badges */}
      <div className="flex flex-wrap gap-2 justify-center">
        <Badge variant="outline" className="gap-1.5 py-1.5 px-3">
          <ImageIcon className="h-3.5 w-3.5" />
          JPG, PNG, WebP, GIF, SVG
        </Badge>
        <Badge variant="outline" className="gap-1.5 py-1.5 px-3">
          <Shield className="h-3.5 w-3.5" />
          Max 2MB per file
        </Badge>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200",
          isDragActive ? "border-primary bg-primary/5 scale-[1.02]" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
          uploading && "pointer-events-none opacity-50"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          <div className={cn(
            "rounded-full p-4 transition-colors",
            isDragActive ? "bg-primary/10" : "bg-muted"
          )}>
            <CloudUpload className={cn("h-10 w-10", isDragActive ? "text-primary" : "text-muted-foreground")} />
          </div>
          <div>
            <p className="text-lg font-medium">
              {isDragActive ? "Drop files here" : "Drag & drop files here"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              or click to browse from your computer
            </p>
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="folder" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Folder
          </Label>
          <Input
            id="folder"
            placeholder="uploads"
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            disabled={uploading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tags" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Tags
          </Label>
          <Input
            id="tags"
            placeholder="nature, featured"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            disabled={uploading}
          />
        </div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{files.length} file{files.length !== 1 ? "s" : ""} selected</span>
              <Button variant="ghost" size="sm" onClick={clearAll} disabled={uploading}>
                Clear all
              </Button>
            </div>
            
            <div className="space-y-2 max-h-64 overflow-auto">
              {files.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                    file.status === "success" && "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900",
                    file.status === "error" && "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900"
                  )}
                >
                  {/* Preview */}
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
                    {file.preview ? (
                      <img src={file.preview} alt={file.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <File className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(file.size)}
                      {file.error && <span className="text-red-500 ml-2">• {file.error}</span>}
                    </p>
                  </div>
                  
                  {/* Status */}
                  <div className="shrink-0">
                    {file.status === "uploading" && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                    {file.status === "success" && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                    {file.status === "error" && <XCircle className="h-5 w-5 text-red-500" />}
                    {file.status === "pending" && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeFile(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Progress */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {/* Upload button */}
            <Button
              className="w-full"
              size="lg"
              onClick={handleUpload}
              disabled={uploading || files.every((f) => f.status !== "pending")}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload {files.filter((f) => f.status === "pending").length} file{files.filter((f) => f.status === "pending").length !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
