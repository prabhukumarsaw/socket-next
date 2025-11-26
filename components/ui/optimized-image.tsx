"use client";

import { useState } from "react";
import Image, { ImageProps } from "next/image";
import { cn } from "@/lib/utils";

/**
 * Optimized Image Component
 * Features:
 * - Lazy loading
 * - Blur-up placeholder
 * - Unoptimized for local/CDN serving
 * - Error handling with fallback
 */

interface OptimizedImageProps extends Omit<ImageProps, "onLoad" | "onError"> {
  blurDataUrl?: string;
  fallbackSrc?: string;
  containerClassName?: string;
}

// Default blur placeholder (tiny gray image)
const DEFAULT_BLUR_DATA_URL =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAUH/8QAIhAAAgIBAwQDAAAAAAAAAAAAAQIDBBEABSEGEjFBUWFx/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAZEQACAwEAAAAAAAAAAAAAAAABAgADESH/2gAMAwEAAhEDEEEDqf/EABkRAAIDAQAAAAAAAAAAAAAAAAECAAMRIf/aAAwDAQACEQMRAD8A";

export function OptimizedImage({
  src,
  alt,
  blurDataUrl,
  fallbackSrc = "/placeholder.png",
  className,
  containerClassName,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const imageSrc = error ? fallbackSrc : src;
  const placeholder = blurDataUrl || DEFAULT_BLUR_DATA_URL;

  // Normalize relative URLs to ensure they work correctly
  // const normalizedSrc = imageSrc && imageSrc.startsWith("/storage/") ? imageSrc : imageSrc;
  const normalizedSrc = typeof imageSrc === "string" && imageSrc.startsWith("/storage/")
? imageSrc
: imageSrc;

  // If fill prop is used, ensure parent has proper dimensions
  const hasFill = props.fill === true;
  
  return (
    <div className={cn(
      "relative overflow-hidden bg-muted/30",
      hasFill && "absolute inset-0 w-full h-full",
      containerClassName
    )}>
      {error ? (
        <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
          <span className="text-xs">Image not found</span>
        </div>
      ) : (
        <Image
          src={normalizedSrc}
          alt={alt}
          className={cn(
            "duration-300 ease-in-out transition-opacity",
            isLoading ? "opacity-0" : "opacity-100",
            className
          )}
          placeholder="blur"
          blurDataURL={placeholder}
          loading="lazy"
          unoptimized // Serve directly without Next.js optimization (for CDN/local)
          onLoad={() => setIsLoading(false)}
          onError={(e) => {
            console.error("Image load error:", normalizedSrc, e);
            setError(true);
            setIsLoading(false);
          }}
          {...props}
        />
      )}
      {isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
    </div>
  );
}

/**
 * Media Image Component
 * Specifically for media library images with relative URLs
 */
interface MediaImageProps extends Omit<OptimizedImageProps, "src"> {
  url: string; // Relative URL from database
  cdnDomain?: string; // Optional CDN domain for production
}

export function MediaImage({
  url,
  cdnDomain,
  ...props
}: MediaImageProps) {
  // If CDN domain is provided, prepend it to the relative URL
  // Otherwise use the relative URL directly (works with Next.js public folder)
  const src = cdnDomain ? `${cdnDomain}${url}` : url;

  return <OptimizedImage src={src} {...props} />;
}


