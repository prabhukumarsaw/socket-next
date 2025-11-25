"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateNews } from "@/lib/actions/news";
import { getPublicMenus } from "@/lib/actions/menus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Editor } from "@/components/blocks/editor-x/editor";
import { SerializedEditorState } from "lexical";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { MediaPicker } from "@/components/media/media-picker";
import NextImage from "next/image";

const updateNewsSchema = z.object({
  id: z.string(),
  title: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  excerpt: z.string().optional(),
  coverImage: z.string().url().optional().or(z.literal("")),
  categoryIds: z.array(z.string()).optional(),
  isPublished: z.boolean().optional(),
  isActive: z.boolean().optional(),
  isBreaking: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.string().optional(),
  ogImage: z.string().url().optional().or(z.literal("")),
  scheduledAt: z.string().datetime().optional(),
});

type UpdateNewsFormData = z.infer<typeof updateNewsSchema>;

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface EditNewsFormProps {
  news: {
    id: string;
    title: string;
    slug: string;
    content: string;
    excerpt: string | null;
    coverImage: string | null;
    isPublished: boolean;
    isActive: boolean;
    isBreaking: boolean;
    isFeatured: boolean;
    metaTitle: string | null;
    metaDescription: string | null;
    metaKeywords: string | null;
    ogImage: string | null;
    scheduledAt: Date | null;
    categories: Array<{
      menu: {
        id: string;
        name: string;
        slug: string;
      };
    }>;
  };
}

export function EditNewsForm({ news }: EditNewsFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    news.categories.map((c) => c.menu.id)
  );
  const [editorContent, setEditorContent] = useState<SerializedEditorState | null>(() => {
    try {
      return JSON.parse(news.content);
    } catch {
      return null;
    }
  });

  // Load categories
  useEffect(() => {
    async function loadCategories() {
      const result = await getPublicMenus();
      if (result.success) {
        setCategories(result.menus);
      }
    }
    loadCategories();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<UpdateNewsFormData>({
    resolver: zodResolver(updateNewsSchema),
    defaultValues: {
      id: news.id,
      title: news.title,
      slug: news.slug,
      excerpt: news.excerpt || "",
      coverImage: news.coverImage || "",
      isPublished: news.isPublished,
      isActive: news.isActive,
      isBreaking: news.isBreaking,
      isFeatured: news.isFeatured,
      metaTitle: news.metaTitle || "",
      metaDescription: news.metaDescription || "",
      metaKeywords: news.metaKeywords || "",
      ogImage: news.ogImage || "",
      categoryIds: news.categories.map((c) => c.menu.id),
    },
  });

  const handleCategorySelect = (categoryId: string) => {
    if (!selectedCategories.includes(categoryId)) {
      const newCategories = [...selectedCategories, categoryId];
      setSelectedCategories(newCategories);
      setValue("categoryIds", newCategories);
    }
  };

  const handleCategoryRemove = (categoryId: string) => {
    const newCategories = selectedCategories.filter((id) => id !== categoryId);
    setSelectedCategories(newCategories);
    setValue("categoryIds", newCategories);
  };

  const handleEditorChange = (serializedState: SerializedEditorState) => {
    setEditorContent(serializedState);
    setValue("content", JSON.stringify(serializedState));
  };

  const onSubmit = async (data: UpdateNewsFormData) => {
    if (editorContent) {
      data.content = JSON.stringify(editorContent);
    }
    
    if (selectedCategories.length > 0) {
      data.categoryIds = selectedCategories;
    }

    setLoading(true);
    try {
      const result = await updateNews(data);

      if (result.success) {
        toast({
          title: "News updated",
          description: "Your news post has been successfully updated.",
        });
        router.push("/dashboard/news");
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update news post",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit News Post</CardTitle>
          <CardDescription>Update your news post information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" {...register("title")} disabled={loading} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" {...register("slug")} disabled={loading} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                {...register("excerpt")}
                disabled={loading}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Categories</Label>
              <Select onValueChange={handleCategorySelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCategories.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedCategories.map((catId) => {
                    const cat = categories.find((c) => c.id === catId);
                    return cat ? (
                      <Badge key={catId} variant="secondary" className="gap-1">
                        {cat.name}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => handleCategoryRemove(catId)}
                        />
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Cover Image</Label>
              <div className="space-y-2">
                <MediaPicker
                  value={watch("coverImage") || ""}
                  onSelect={(url) => setValue("coverImage", url)}
                  type="image"
                  label="Select Cover Image"
                />
                {watch("coverImage") && (
                  <div className="relative w-full h-48 bg-muted rounded-lg overflow-hidden border">
                    <NextImage
                      src={watch("coverImage")}
                      alt="Cover preview"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => setValue("coverImage", "")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <div className="min-h-[400px]">
                <Editor
                  editorSerializedState={editorContent || undefined}
                  onSerializedChange={handleEditorChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPublished"
                  checked={watch("isPublished")}
                  onCheckedChange={(checked) => setValue("isPublished", checked as boolean)}
                  disabled={loading}
                />
                <Label htmlFor="isPublished" className="text-sm font-normal cursor-pointer">
                  Published
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isBreaking"
                  checked={watch("isBreaking")}
                  onCheckedChange={(checked) => setValue("isBreaking", checked as boolean)}
                  disabled={loading}
                />
                <Label htmlFor="isBreaking" className="text-sm font-normal cursor-pointer">
                  Breaking News
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isFeatured"
                  checked={watch("isFeatured")}
                  onCheckedChange={(checked) => setValue("isFeatured", checked as boolean)}
                  disabled={loading}
                />
                <Label htmlFor="isFeatured" className="text-sm font-normal cursor-pointer">
                  Featured
                </Label>
              </div>
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

            <div className="border-t pt-6 space-y-4">
              <h3 className="text-lg font-semibold">SEO Settings</h3>
              
              <div className="space-y-2">
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input id="metaTitle" {...register("metaTitle")} disabled={loading} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  {...register("metaDescription")}
                  disabled={loading}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="metaKeywords">Meta Keywords</Label>
                <Input id="metaKeywords" {...register("metaKeywords")} disabled={loading} />
              </div>

              <div className="space-y-2">
                <Label>OpenGraph Image</Label>
                <div className="space-y-2">
                  <MediaPicker
                    value={watch("ogImage") || ""}
                    onSelect={(url) => setValue("ogImage", url)}
                    type="image"
                    label="Select OG Image"
                  />
                  {watch("ogImage") && (
                    <div className="relative w-full h-32 bg-muted rounded-lg overflow-hidden border">
                      <NextImage
                        src={watch("ogImage")}
                        alt="OG preview"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => setValue("ogImage", "")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update News Post
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

