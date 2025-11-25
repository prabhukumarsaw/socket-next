/**
 * Search Filters Component
 * 
 * Provides filtering options for search results
 */

"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

export function SearchFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [category, setCategory] = React.useState(searchParams.get("category") || "");
  const [dateFrom, setDateFrom] = React.useState(searchParams.get("dateFrom") || "");
  const [dateTo, setDateTo] = React.useState(searchParams.get("dateTo") || "");
  const [isBreaking, setIsBreaking] = React.useState(
    searchParams.get("isBreaking") === "true"
  );
  const [isFeatured, setIsFeatured] = React.useState(
    searchParams.get("isFeatured") === "true"
  );

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (category) params.set("category", category);
    else params.delete("category");
    
    if (dateFrom) params.set("dateFrom", dateFrom);
    else params.delete("dateFrom");
    
    if (dateTo) params.set("dateTo", dateTo);
    else params.delete("dateTo");
    
    if (isBreaking) params.set("isBreaking", "true");
    else params.delete("isBreaking");
    
    if (isFeatured) params.set("isFeatured", "true");
    else params.delete("isFeatured");
    
    params.set("page", "1"); // Reset to first page
    router.push(`/search?${params.toString()}`);
  };

  const clearFilters = () => {
    setCategory("");
    setDateFrom("");
    setDateTo("");
    setIsBreaking(false);
    setIsFeatured(false);
    
    const params = new URLSearchParams(searchParams.toString());
    params.delete("category");
    params.delete("dateFrom");
    params.delete("dateTo");
    params.delete("isBreaking");
    params.delete("isFeatured");
    params.set("page", "1");
    router.push(`/search?${params.toString()}`);
  };

  const hasActiveFilters =
    category || dateFrom || dateTo || isBreaking || isFeatured;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Filters</h2>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g., sport, business"
            onKeyDown={(e) => {
              if (e.key === "Enter") applyFilters();
            }}
          />
        </div>

        <div>
          <Label htmlFor="dateFrom">From Date</Label>
          <Input
            id="dateFrom"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="dateTo">To Date</Label>
          <Input
            id="dateTo"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Type</Label>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isBreaking}
                onChange={(e) => setIsBreaking(e.target.checked)}
              />
              <span className="text-sm">Breaking News</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
              />
              <span className="text-sm">Featured News</span>
            </label>
          </div>
        </div>

        <Button onClick={applyFilters} className="w-full">
          Apply Filters
        </Button>
      </div>
    </div>
  );
}

