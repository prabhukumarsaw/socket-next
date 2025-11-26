"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUploader } from "@/components/misc/file-uploader";
import { uploadMedia } from "@/lib/actions/media";
import { getUserMedia } from "@/lib/actions/media";
import { useToast } from "@/hooks/use-toast";
import { Search, Image as ImageIcon, Check, X, Shield } from "lucide-react";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { formatBytes } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

interface Media {
  id: string;
  name: string;
  url: string;
  publicId: string;
  format: string;
  resourceType: "image" | "video" | "raw";
  bytes: number | null;
  width: number | null;
  height: number | null;
  createdAt: Date;
}

interface MediaPickerProps {
  value?: string;
  onSelect: (url: string, mediaId?: string) => void;
  type?: "image" | "video" | "all";
  label?: string;
  description?: string;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];

export function MediaPicker({ 
  value, 
  onSelect, 
  type = "image",
  label = "Select Media",
  description 
}: MediaPickerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<string | null>(value || null);
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    if (open) {
      loadMedia();
    }
  }, [open]);

  const loadMedia = async () => {
    setLoading(true);
    const result = await getUserMedia(1, 50, search, {
      resourceType: type === "all" ? undefined : type,
    });
    if (result.success) {
      setMedia(result.media as unknown as Media[]);
    }
    setLoading(false);
  };

  const handleUpload = async (filesToUpload: File[]) => {
    if (filesToUpload.length === 0) return;

    setUploading(true);
    try {
      // Validate file sizes (2MB limit for local storage)
      const invalidSizeFiles = filesToUpload.filter((file) => file.size > MAX_FILE_SIZE);
      if (invalidSizeFiles.length > 0) {
        const names = invalidSizeFiles.map(f => `${f.name} (${(f.size / 1024 / 1024).toFixed(2)}MB)`).join(", ");
        toast({
          title: "Files too large",
          description: `Maximum size is 2MB. Files exceeding limit: ${names}`,
          variant: "destructive",
        });
        setUploading(false);
        return;
      }

      // Validate file types
      const invalidTypeFiles = filesToUpload.filter((file) => !ALLOWED_IMAGE_TYPES.includes(file.type));
      if (invalidTypeFiles.length > 0) {
        toast({
          title: "Invalid file types",
          description: "Only JPG, PNG, WebP, GIF, and SVG files are allowed.",
          variant: "destructive",
        });
        setUploading(false);
        return;
      }

      const uploadPromises = filesToUpload.map((file) =>
        uploadMedia(file, "uploads", ["media-picker"])
      );

      const results = await Promise.all(uploadPromises);
      const successCount = results.filter((r) => r.success).length;
      const failCount = results.length - successCount;

      if (successCount > 0) {
        toast({
          title: "Upload successful",
          description: `${successCount} file(s) uploaded${failCount > 0 ? `, ${failCount} failed` : ""}`,
        });
        setFiles([]);
        loadMedia();
        router.refresh();
      } else {
        const errors = results
          .filter((r) => !r.success)
          .map((r) => r.error)
          .join(", ");
        toast({
          title: "Upload failed",
          description: errors || "Failed to upload files",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Upload error",
        description: error.message || "Failed to upload files",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSelect = (mediaItem: Media) => {
    setSelectedMedia(mediaItem.url);
    onSelect(mediaItem.url, mediaItem.id);
    setOpen(false);
  };

  const filteredMedia = media.filter((m) =>
    search ? m.name.toLowerCase().includes(search.toLowerCase()) : true
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="w-full">
          <ImageIcon className="h-4 w-4 mr-2" />
          {value ? "Change Media" : label}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <Tabs defaultValue="library" className="flex-1 flex flex-col overflow-hidden">
          <TabsList>
            <TabsTrigger value="library">Media Library</TabsTrigger>
            <TabsTrigger value="upload">Upload New</TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="flex-1 overflow-hidden flex flex-col">
            <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
              <div className="flex gap-2">
                <Input
                  placeholder="Search media..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    loadMedia();
                  }}
                  className="flex-1"
                />
                <Button variant="outline" onClick={loadMedia}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="flex-1 overflow-auto">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredMedia.map((item) => (
                      <div
                        key={item.id}
                        className={`
                          relative border-2 rounded-lg overflow-hidden cursor-pointer
                          transition-all hover:shadow-lg
                          ${selectedMedia === item.url ? "border-primary ring-2 ring-primary" : "border-border"}
                        `}
                        onClick={() => handleSelect(item)}
                      >
                        {item.resourceType === "image" ? (
                          <div className="aspect-square relative bg-background w-full">
                            <OptimizedImage
                              src={item.url}
                              alt={item.name}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                            />
                          </div>
                        ) : (
                          <div className="aspect-square bg-muted/50 flex items-center justify-center w-full">
                            <ImageIcon className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        
                        {selectedMedia === item.url && (
                          <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                            <Check className="h-4 w-4" />
                          </div>
                        )}

                        <div className="p-2 bg-background">
                          <p className="text-sm font-medium truncate" title={item.name}>
                            {item.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatBytes(item.bytes || 0)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {filteredMedia.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      No media found. Upload some files!
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="upload" className="flex-1 overflow-auto">
            <div className="space-y-4">
              {/* File requirements */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-xs">
                  <ImageIcon className="h-3 w-3 mr-1" />
                  JPG, PNG, WebP, GIF, SVG
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  Max 2MB per file
                </Badge>
              </div>

              <FileUploader
                value={files}
                onValueChange={setFiles}
                onUpload={handleUpload}
                accept={{
                  "image/jpeg": [".jpg", ".jpeg"],
                  "image/png": [".png"],
                  "image/webp": [".webp"],
                  "image/gif": [".gif"],
                  "image/svg+xml": [".svg"],
                }}
                maxSize={MAX_FILE_SIZE}
                multiple
                disabled={uploading}
              />
              {uploading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading & compressing...
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {value && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Selected:</span>
                <span className="text-sm text-muted-foreground truncate max-w-md">
                  {value}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSelectedMedia(null);
                  onSelect("");
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
