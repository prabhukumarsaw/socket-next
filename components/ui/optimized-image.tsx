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

  return (
    <div className={cn("relative overflow-hidden", containerClassName)}>
      <Image
        src={imageSrc}
        alt={alt}
        className={cn(
          "duration-500 ease-in-out",
          isLoading ? "scale-105 blur-sm" : "scale-100 blur-0",
          className
        )}
        placeholder="blur"
        blurDataURL={placeholder}
        loading="lazy"
        unoptimized // Serve directly without Next.js optimization (for CDN/local)
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setError(true);
          setIsLoading(false);
        }}
        {...props}
      />
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


