"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const menuSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  path: z.string().optional(),
  icon: z.string().optional(),
  parentId: z.string().optional().nullable(),
  order: z.number().int().default(0),
  isPublic: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

type MenuFormData = z.infer<typeof menuSchema>;

interface Menu {
  id: string;
  name: string;
  slug: string;
  path: string | null;
  icon: string | null;
  parentId: string | null;
  order: number;
  isPublic: boolean;
  isActive: boolean;
  children: Menu[];
}

interface MenuFormProps {
  menu?: Menu | null;
  menus: Menu[];
  onSubmit: (data: MenuFormData & { id?: string }) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function MenuForm({ menu, menus, onSubmit, onCancel, loading }: MenuFormProps) {
  const { toast } = useToast();
  const isEdit = !!menu;

  // Filter out the current menu and its children from parent options
  const availableParents = menu
    ? menus.filter((m) => m.id !== menu.id && !isDescendant(m, menu.id))
    : menus;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<MenuFormData>({
    resolver: zodResolver(menuSchema),
    defaultValues: {
      name: menu?.name || "",
      slug: menu?.slug || "",
      path: menu?.path || "",
      icon: menu?.icon || "",
      parentId: menu?.parentId || null,
      order: menu?.order || 0,
      isPublic: menu?.isPublic || false,
      isActive: menu?.isActive ?? true,
    },
  });

  const handleFormSubmit = async (data: MenuFormData) => {
    try {
      // Normalize parentId: convert "none" or empty to null
      const normalizedData = {
        ...data,
        parentId: !data.parentId || data.parentId === "none" || data.parentId === "" 
          ? null 
          : data.parentId,
      };
      await onSubmit(isEdit ? { ...normalizedData, id: menu.id } : normalizedData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save menu",
        variant: "destructive",
      });
    }
  };

  // Auto-generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    if (!isEdit && !watch("slug")) {
      const slug = name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setValue("slug", slug);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? "Edit Menu" : "Create Menu"}</CardTitle>
        <CardDescription>
          {isEdit ? "Update menu information" : "Create a new menu item"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="Menu Name"
              {...register("name")}
              onChange={handleNameChange}
              disabled={loading}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug *</Label>
            <Input
              id="slug"
              placeholder="menu-slug"
              {...register("slug")}
              disabled={loading}
            />
            {errors.slug && (
              <p className="text-sm text-destructive">{errors.slug.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              URL-friendly identifier (e.g., dashboard, news, about)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="path">Path</Label>
            <Input
              id="path"
              placeholder="/dashboard/menus"
              {...register("path")}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Route path for navigation (optional)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="icon">Icon</Label>
            <Input
              id="icon"
              placeholder="dashboard"
              {...register("icon")}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Icon name (e.g., dashboard, user, settings)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="parentId">Parent Menu</Label>
              <Select
                onValueChange={(value) => {
                  // Convert "none" to null, otherwise use the value
                  setValue("parentId", value === "none" ? null : value || null);
                }}
                value={watch("parentId") || "none"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Root Menu)</SelectItem>
                  {availableParents.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name} ({m.slug})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="order">Order</Label>
              <Input
                id="order"
                type="number"
                {...register("order", { valueAsNumber: true })}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Display order (lower numbers appear first)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPublic"
                checked={watch("isPublic")}
                onCheckedChange={(checked) => setValue("isPublic", checked as boolean)}
                disabled={loading}
              />
              <Label htmlFor="isPublic" className="text-sm font-normal cursor-pointer">
                Public (Category for News)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={watch("isActive")}
                onCheckedChange={(checked) => setValue("isActive", checked as boolean)}
                disabled={loading}
              />
              <Label htmlFor="isActive" className="text-sm font-normal cursor-pointer">
                Active
              </Label>
            </div>
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Update Menu" : "Create Menu"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// Helper function to check if a menu is a descendant
function isDescendant(menu: Menu, ancestorId: string): boolean {
  if (menu.id === ancestorId) return true;
  return menu.children.some((child) => isDescendant(child, ancestorId));
}

