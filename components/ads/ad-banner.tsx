/**
 * Ad Banner Component
 * Modern, responsive advertisement banner component
 */

"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import type { AdDisplay } from "@/lib/services/ads.service";

interface AdBannerProps {
  ad: AdDisplay;
  className?: string;
  size?: "small" | "medium" | "large" | "leaderboard" | "sidebar";
  showLabel?: boolean;
  priority?: boolean;
}

const sizeClasses = {
  small: "w-full h-16",
  medium: "w-full h-32",
  large: "w-full h-48",
  leaderboard: "w-full max-w-[970px] h-[90px]",
  sidebar: "w-full aspect-[3/4] max-w-[300px]",
};

export function AdBanner({ 
  ad, 
  className, 
  size = "medium",
  showLabel = true,
  priority = false 
}: AdBannerProps) {
  // Track impression
  useEffect(() => {
    if (ad.id && !ad.id.startsWith("default-")) {
      // Track impression in background (non-blocking)
      fetch(`/api/ads/impression/${ad.id}`, { method: "POST" }).catch(() => {
        // Silently fail - don't break the page
      });
    }
  }, [ad.id]);

  // Determine click URL
  const clickUrl = ad.newsSlug ? `/news/${ad.newsSlug}` : ad.linkUrl;

  const handleClick = () => {
    if (ad.id && !ad.id.startsWith("default-") && clickUrl) {
      // Track click in background (non-blocking)
      fetch(`/api/ads/click/${ad.id}`, { method: "POST" }).catch(() => {
        // Silently fail - don't break the page
      });
    }
  };

  const content = (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-border bg-muted/50 transition-all duration-300 hover:shadow-lg",
        sizeClasses[size],
        className
      )}
    >
      {showLabel && (
        <div className="absolute top-0 left-0 z-10 bg-black/60 px-2 py-1 text-[10px] uppercase tracking-wider text-white">
          Advertisement
        </div>
      )}
      
      <Image
        src={ad.imageUrl || "https://via.placeholder.com/300x200/1e293b/94a3b8?text=Advertisement"}
        alt={ad.title}
        fill
        className="object-cover transition-transform duration-300 hover:scale-105"
        sizes={
          size === "leaderboard" 
            ? "(max-width: 768px) 100vw, 970px"
            : size === "sidebar"
            ? "(max-width: 768px) 100vw, 300px"
            : "(max-width: 768px) 100vw, 50vw"
        }
        priority={priority}
        unoptimized={ad.imageUrl?.startsWith("https://via.placeholder.com") || false}
      />
      
      {ad.description && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3">
          <p className="text-xs font-medium text-white line-clamp-2">{ad.description}</p>
        </div>
      )}
    </div>
  );

  if (clickUrl) {
    return (
      <Link 
        href={clickUrl} 
        onClick={handleClick}
        className="block"
        target={ad.linkUrl?.startsWith("http") ? "_blank" : undefined}
        rel={ad.linkUrl?.startsWith("http") ? "noopener noreferrer" : undefined}
      >
        {content}
      </Link>
    );
  }

  return content;
}

