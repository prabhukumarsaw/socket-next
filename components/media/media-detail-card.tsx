"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Download, ExternalLink, Image as ImageIcon, Video, File } from "lucide-react";
import NextImage from "next/image";
import { formatBytes, formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

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
  duration: number | null;
  folder: string | null;
  tags: string[];
  uploader: {
    id: string;
    username: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  createdAt: Date;
}

interface MediaDetailCardProps {
  media: Media;
}

export function MediaDetailCard({ media }: MediaDetailCardProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
    setTimeout(() => setCopied(null), 2000);
  };

  const getResourceIcon = () => {
    switch (media.resourceType) {
      case "image":
        return <ImageIcon className="h-5 w-5" />;
      case "video":
        return <Video className="h-5 w-5" />;
      default:
        return <File className="h-5 w-5" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getResourceIcon()}
          Media Details
        </CardTitle>
        <CardDescription>Complete information about this media file</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Preview */}
        <div className="space-y-2">
          <Label>Preview</Label>
          {media.resourceType === "image" ? (
            <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden border">
              <NextImage
                src={media.url}
                alt={media.name}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          ) : (
            <div className="w-full aspect-video bg-muted rounded-lg flex items-center justify-center border">
              {getResourceIcon()}
              <span className="ml-2 text-muted-foreground">{media.name}</span>
            </div>
          )}
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={media.name} readOnly />
          </div>
          <div className="space-y-2">
            <Label>Format</Label>
            <div className="flex items-center gap-2">
              <Input value={media.format.toUpperCase()} readOnly className="flex-1" />
              <Badge variant="outline">{media.resourceType}</Badge>
            </div>
          </div>
        </div>

        {/* Dimensions & Size */}
        <div className="grid grid-cols-3 gap-4">
          {media.width && media.height && (
            <>
              <div className="space-y-2">
                <Label>Width</Label>
                <Input value={`${media.width}px`} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Height</Label>
                <Input value={`${media.height}px`} readOnly />
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label>Size</Label>
            <Input value={formatBytes(media.bytes || 0)} readOnly />
          </div>
        </div>

        {/* URLs */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>URL</Label>
            <div className="flex gap-2">
              <Input value={media.url} readOnly className="flex-1 font-mono text-sm" />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(media.url, "URL")}
              >
                {copied === "URL" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => window.open(media.url, "_blank")}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Public ID</Label>
            <div className="flex gap-2">
              <Input value={media.publicId} readOnly className="flex-1 font-mono text-sm" />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(media.publicId, "Public ID")}
              >
                {copied === "Public ID" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Media ID</Label>
            <div className="flex gap-2">
              <Input value={media.id} readOnly className="flex-1 font-mono text-sm" />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(media.id, "Media ID")}
              >
                {copied === "Media ID" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4">
          {media.folder && (
            <div className="space-y-2">
              <Label>Folder</Label>
              <Input value={media.folder} readOnly />
            </div>
          )}
          <div className="space-y-2">
            <Label>Uploaded</Label>
            <Input value={formatDate(media.createdAt)} readOnly />
          </div>
        </div>

        {media.tags.length > 0 && (
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2">
              {media.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Uploader Info */}
        <div className="space-y-2">
          <Label>Uploaded By</Label>
          <Input
            value={
              media.uploader.firstName || media.uploader.lastName
                ? `${media.uploader.firstName || ""} ${media.uploader.lastName || ""}`.trim()
                : media.uploader.username
            }
            readOnly
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              const link = document.createElement("a");
              link.href = media.url;
              link.download = media.name;
              link.click();
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => window.open(media.url, "_blank")}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in New Tab
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

