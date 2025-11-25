/**
 * Advanced Search Bar Component
 * 
 * Features:
 * - Debounced search input
 * - Autocomplete suggestions
 * - Search results dropdown
 * - Keyboard navigation
 * - Mobile responsive
 */

"use client";

import * as React from "react";
import { Search, X, Loader2, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface SearchSuggestion {
  id: string;
  title: string;
  slug: string;
  type: "news";
  coverImage?: string | null;
  publishedAt?: string | null;
}

interface SearchBarProps {
  variant?: "desktop" | "mobile";
  onClose?: () => void;
}

export function SearchBar({ variant = "desktop", onClose }: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [suggestions, setSuggestions] = React.useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(-1);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const suggestionsRef = React.useRef<HTMLDivElement>(null);

  // Debounce search
  React.useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/news/search?quick=true&q=${encodeURIComponent(query)}&limit=5`
        );
        const data = await response.json();
        if (data.success && data.data) {
          // Map API response to SearchSuggestion format
          const mapped = data.data.map((item: any) => ({
            id: item.id,
            title: item.title,
            slug: item.slug,
            type: "news" as const,
            coverImage: item.coverImage,
            publishedAt: item.publishedAt,
          }));
          setSuggestions(mapped);
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Handle search submission
  const handleSearch = (searchQuery?: string) => {
    const finalQuery = searchQuery || query;
    if (finalQuery.trim().length < 2) return;

    router.push(`/search?q=${encodeURIComponent(finalQuery.trim())}`);
    setShowSuggestions(false);
    onClose?.();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        router.push(`/news/${suggestions[selectedIndex].slug}`);
        setShowSuggestions(false);
        onClose?.();
      } else {
        handleSearch();
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      onClose?.();
    }
  };

  // Scroll selected suggestion into view
  React.useEffect(() => {
    if (selectedIndex >= 0 && suggestionsRef.current) {
      const selectedElement = suggestionsRef.current.children[
        selectedIndex
      ] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  // Close suggestions when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isMobile = variant === "mobile";

  return (
    <div className="relative w-full">
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search news..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setShowSuggestions(true);
          }}
          className={cn(
            "pl-9 pr-10",
            isMobile ? "h-10" : "h-9"
          )}
          autoFocus={isMobile}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 h-4 w-4 animate-spin text-muted-foreground" />
        )}
        {query && !isLoading && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 h-8 w-8"
            onClick={() => {
              setQuery("");
              setSuggestions([]);
              setShowSuggestions(false);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-80 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <Link
              key={suggestion.id}
              href={`/news/${suggestion.slug}`}
              onClick={() => {
                setShowSuggestions(false);
                onClose?.();
              }}
              className={cn(
                "flex items-start gap-3 px-4 py-3 hover:bg-accent transition-colors cursor-pointer",
                index === selectedIndex && "bg-accent"
              )}
            >
              {suggestion.coverImage && (
                <img
                  src={suggestion.coverImage}
                  alt={suggestion.title}
                  className="w-12 h-12 object-cover rounded flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium line-clamp-2">{suggestion.title}</span>
                {suggestion.publishedAt && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(suggestion.publishedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </Link>
          ))}
          <div className="border-t border-border px-4 py-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs"
              onClick={() => handleSearch()}
            >
              <Clock className="h-3 w-3 mr-2" />
              Search for &quot;{query}&quot;
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

