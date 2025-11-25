"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createNews } from "@/lib/actions/news";
import { getPublicMenus } from "@/lib/actions/menus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Calendar, Image, Settings, FileText, Tag, Globe, Share2 } from "lucide-react";
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
import { X, Plus, Eye, EyeOff } from "lucide-react";
import { MediaPicker } from "@/components/media/media-picker";
import NextImage from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const createNewsSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  slug: z.string().min(1, "Slug is required").max(200, "Slug must be less than 200 characters").optional(),
  content: z.string().min(1, "Content is required"),
  excerpt: z.string().max(300, "Excerpt must be less than 300 characters").optional(),
  coverImage: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  categoryIds: z.array(z.string()).min(1, "At least one category is required"),
  isPublished: z.boolean().default(false),
  isBreaking: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  metaTitle: z.string().max(60, "Meta title should be under 60 characters").optional(),
  metaDescription: z.string().max(160, "Meta description should be under 160 characters").optional(),
  metaKeywords: z.string().optional(),
  ogImage: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  scheduledAt: z.string().datetime().optional(),
  isScheduled: z.boolean().default(false),
});

type CreateNewsFormData = z.infer<typeof createNewsSchema>;

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface FormStatus {
  isDirty: boolean;
  isValid: boolean;
}

export function CreateNewsForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [autoSlug, setAutoSlug] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [editorContent, setEditorContent] = useState<SerializedEditorState | null>(null);
  const [contentText, setContentText] = useState("");
  const [isScheduled, setIsScheduled] = useState(false);
  const [charCount, setCharCount] = useState({ title: 0, excerpt: 0, metaTitle: 0, metaDescription: 0 });

  // Load categories
  useEffect(() => {
    async function loadCategories() {
      try {
        const result = await getPublicMenus();
        if (result.success) {
          setCategories(result.menus || []);
        } else {
          toast({
            title: "Error",
            description: "Failed to load categories",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load categories",
          variant: "destructive",
        });
      }
    }
    loadCategories();
  }, [toast]);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isValid },
    watch,
    setValue,
    trigger,
  } = useForm<CreateNewsFormData>({
    resolver: zodResolver(createNewsSchema),
    defaultValues: {
      isPublished: false,
      isBreaking: false,
      isFeatured: false,
      isScheduled: false,
      categoryIds: [],
    },
    mode: "onChange",
  });

  const title = watch("title");
  const slug = watch("slug");
  const excerpt = watch("excerpt");
  const metaTitle = watch("metaTitle");
  const metaDescription = watch("metaDescription");
  const coverImage = watch("coverImage");
  const ogImage = watch("ogImage");

  // Update character counts
  useEffect(() => {
    setCharCount({
      title: title?.length || 0,
      excerpt: excerpt?.length || 0,
      metaTitle: metaTitle?.length || 0,
      metaDescription: metaDescription?.length || 0,
    });
  }, [title, excerpt, metaTitle, metaDescription]);

  // Auto-generate slug from title
  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setValue("title", newTitle, { shouldValidate: true });
    
    if (autoSlug) {
      const generatedSlug = newTitle
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setValue("slug", generatedSlug, { shouldValidate: true });
    }
  }, [autoSlug, setValue]);

  const handleCategorySelect = useCallback((categoryId: string) => {
    if (!selectedCategories.includes(categoryId)) {
      const newCategories = [...selectedCategories, categoryId];
      setSelectedCategories(newCategories);
      setValue("categoryIds", newCategories, { shouldValidate: true });
    }
  }, [selectedCategories, setValue]);

  const handleCategoryRemove = useCallback((categoryId: string) => {
    const newCategories = selectedCategories.filter((id) => id !== categoryId);
    setSelectedCategories(newCategories);
    setValue("categoryIds", newCategories, { shouldValidate: true });
  }, [selectedCategories, setValue]);

  const handleEditorChange = useCallback((serializedState: SerializedEditorState) => {
    setEditorContent(serializedState);
    const text = JSON.stringify(serializedState);
    setContentText(text);
    setValue("content", text, { shouldValidate: true });
  }, [setValue]);

  const handleImageSelect = useCallback((field: "coverImage" | "ogImage", url: string) => {
    setValue(field, url, { shouldValidate: true });
  }, [setValue]);

  const handleImageRemove = useCallback((field: "coverImage" | "ogImage") => {
    setValue(field, "", { shouldValidate: true });
  }, [setValue]);

  const handleScheduleToggle = useCallback((checked: boolean) => {
    setIsScheduled(checked);
    setValue("isScheduled", checked, { shouldValidate: true });
    if (!checked) {
      setValue("scheduledAt", "", { shouldValidate: true });
    }
  }, [setValue]);

  const onSubmit = async (data: CreateNewsFormData) => {
    if (!editorContent) {
      toast({
        title: "Error",
        description: "Please add content to your news post",
        variant: "destructive",
      });
      return;
    }

    if (selectedCategories.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one category",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await createNews({
        ...data,
        content: JSON.stringify(editorContent),
        categoryIds: selectedCategories,
      });

      if (result.success) {
        toast({
          title: "Success",
          description: data.isPublished ? "Your news post has been published!" : "Your news post has been saved as draft.",
        });
        router.push("/dashboard/news");
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create news post",
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

  const CharacterCounter = ({ current, max }: { current: number; max: number }) => (
    <span className={`text-xs ${current > max ? 'text-destructive' : 'text-muted-foreground'}`}>
      {current}/{max}
    </span>
  );

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background py-6">
        <div className="max-w-[90rem] mx-auto">
       

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
           <div className="grid grid-cols-1 xl:grid-cols-10 gap-2 lg:gap-4">

              
              {/* Main Content Area - 70% width on desktop */}
     <div className="xl:col-span-7 space-y-4 lg:space-y-6">
   {/* Basic Information Card */}
                <Card className="shadow-sm border">
                  <CardHeader className="pb-0">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <FileText className="h-5 w-5 text-primary" />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="title" className="text-base font-medium">Title *</Label>
                        <CharacterCounter current={charCount.title} max={200} />
                      </div>
                      <Input
                        id="title"
                        placeholder="Breaking: Important News Headline"
                        {...register("title")}
                        onChange={handleTitleChange}
                        disabled={loading}
                        className="text-lg h-12"
                      />
                      {errors.title && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <X className="h-3 w-3" />
                          {errors.title.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="slug" className="text-base font-medium">Slug *</Label>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="autoSlug"
                            checked={autoSlug}
                            onCheckedChange={setAutoSlug}
                            disabled={loading}
                          />
                          <Label htmlFor="autoSlug" className="text-sm font-normal cursor-pointer">
                            Auto-generate
                          </Label>
                        </div>
                      </div>
                      <Input
                        id="slug"
                        placeholder="breaking-important-news-headline"
                        {...register("slug")}
                        disabled={loading || autoSlug}
                        className="h-10 font-mono text-sm"
                      />
                      {errors.slug && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <X className="h-3 w-3" />
                          {errors.slug.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="excerpt" className="text-base font-medium">Excerpt</Label>
                        <CharacterCounter current={charCount.excerpt} max={300} />
                      </div>
                      <Textarea
                        id="excerpt"
                        placeholder="Short description of the news..."
                        {...register("excerpt")}
                        disabled={loading}
                        rows={4}
                        className="resize-none"
                      />
                      {errors.excerpt && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <X className="h-3 w-3" />
                          {errors.excerpt.message}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Content Editor Card */}
                
                  <div>
                    <div className="min-h-[500px] border rounded-lg overflow-hidden">
                      <Editor
                        editorSerializedState={editorContent || undefined}
                        onSerializedChange={handleEditorChange}
                      />
                    </div>
                    {errors.content && (
                      <p className="text-sm text-destructive mt-2 flex items-center gap-1">
                        <X className="h-3 w-3" />
                        {errors.content.message}
                      </p>
                    )}
                  </div>
             

                {/* Media Section - Separate Card */}
                <Card className="shadow-sm border">
               
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-base font-medium">Cover Image</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Main image displayed with your news post
                        </p>
                      </div>
                      <MediaPicker
                        value={coverImage || ""}
                        onSelect={(url) => handleImageSelect("coverImage", url)}
                        type="image"
                        label="Select Cover Image"
                        description="Recommended size: 1200x630px"
                      />
                      {coverImage && (
                        <div className="relative mb-2 aspect-[3/2] w-full overflow-hidden rounded-sm">
                          <NextImage
                            src={coverImage}
                            alt="Cover preview"
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                    
                            sizes="(max-width: 768px) 100vw, 50vw"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-8 w-8"
                            onClick={() => handleImageRemove("coverImage")}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      {errors.coverImage && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <X className="h-3 w-3" />
                          {errors.coverImage.message}
                        </p>
                      )}
                    </div>

                   

                    <div className="space-y-4">
                      <div>
                        <Label className="text-base font-medium">OpenGraph Image</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Image for social media sharing (optional)
                        </p>
                      </div>
                      <MediaPicker
                        value={ogImage || ""}
                        onSelect={(url) => handleImageSelect("ogImage", url)}
                        type="image"
                        label="Select OG Image"
                        description="Recommended size: 1200x630px"
                      />
                      {ogImage && (
                        <div className="relative mb-2 aspect-[3/2] w-full overflow-hidden rounded-sm">
                          <NextImage
                            src={ogImage}
                            alt="OG preview"
                            fill
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="(max-width: 768px) 100vw, 50vw"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-8 w-8"
                            onClick={() => handleImageRemove("ogImage")}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      {errors.ogImage && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <X className="h-3 w-3" />
                          {errors.ogImage.message}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* SEO Settings Card */}
                <Card className="shadow-sm border">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Globe className="h-5 w-5 text-primary" />
                      SEO Settings
                    </CardTitle>
                    <CardDescription>
                      Optimize your news post for search engines
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="metaTitle" className="text-base font-medium">Meta Title</Label>
                        <CharacterCounter current={charCount.metaTitle} max={60} />
                      </div>
                      <Input
                        id="metaTitle"
                        placeholder="SEO optimized title"
                        {...register("metaTitle")}
                        disabled={loading}
                      />
                      {errors.metaTitle && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <X className="h-3 w-3" />
                          {errors.metaTitle.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="metaDescription" className="text-base font-medium">Meta Description</Label>
                        <CharacterCounter current={charCount.metaDescription} max={160} />
                      </div>
                      <Textarea
                        id="metaDescription"
                        placeholder="SEO description (150-160 characters recommended)"
                        {...register("metaDescription")}
                        disabled={loading}
                        rows={3}
                        className="resize-none"
                      />
                      {errors.metaDescription && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <X className="h-3 w-3" />
                          {errors.metaDescription.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="metaKeywords" className="text-base font-medium">Meta Keywords</Label>
                      <Input
                        id="metaKeywords"
                        placeholder="keyword1, keyword2, keyword3"
                        {...register("metaKeywords")}
                        disabled={loading}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar Area - 30% width on desktop */}
                <div className="xl:col-span-3 space-y-6 lg:space-y-8">
  
                <div className="xl:sticky xl:top-6 space-y-6">
                  {/* Publishing Actions Card */}
                  <Card className="shadow-sm border">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Share2 className="h-5 w-5 text-primary" />
                        Publishing
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="isPublished" className="text-base font-medium cursor-pointer">
                              Publish Status
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              {watch("isPublished") ? "Visible to readers" : "Save as draft"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {watch("isPublished") ? <Eye className="h-4 w-4 text-green-600" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                            <Switch
                              id="isPublished"
                              checked={watch("isPublished")}
                              onCheckedChange={(checked) => setValue("isPublished", checked, { shouldValidate: true })}
                              disabled={loading}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="isBreaking" className="text-base font-medium cursor-pointer">
                              Breaking News
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Highlight as urgent news
                            </p>
                          </div>
                          <Switch
                            id="isBreaking"
                            checked={watch("isBreaking")}
                            onCheckedChange={(checked) => setValue("isBreaking", checked, { shouldValidate: true })}
                            disabled={loading}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="isFeatured" className="text-base font-medium cursor-pointer">
                              Featured
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Show on featured sections
                            </p>
                          </div>
                          <Switch
                            id="isFeatured"
                            checked={watch("isFeatured")}
                            onCheckedChange={(checked) => setValue("isFeatured", checked, { shouldValidate: true })}
                            disabled={loading}
                          />
                        </div>
                      </div>

                      <Separator />

                      {/* Schedule Section */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="isScheduled" className="text-base font-medium cursor-pointer">
                              Schedule
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Publish at a specific time
                            </p>
                          </div>
                          <Switch
                            id="isScheduled"
                            checked={isScheduled}
                            onCheckedChange={handleScheduleToggle}
                            disabled={loading || watch("isPublished")}
                          />
                        </div>

                        {isScheduled && (
                          <div className="space-y-3">
                            <Label htmlFor="scheduledAt">Publish Date & Time</Label>
                            <Input
                              id="scheduledAt"
                              type="datetime-local"
                              {...register("scheduledAt")}
                              disabled={loading}
                              min={new Date().toISOString().slice(0, 16)}
                            />
                            {errors.scheduledAt && (
                              <p className="text-sm text-destructive">{errors.scheduledAt.message}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-3 pt-4 border-t bg-muted/50">
                      <Button 
                        type="submit" 
                        disabled={loading || !isValid}
                        className="w-full h-11 text-base font-semibold"
                        size="lg"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {watch("isPublished") ? "Publishing..." : "Saving..."}
                          </>
                        ) : (
                          <>
                            {watch("isPublished") ? (
                              <>
                                <Eye className="mr-2 h-4 w-4" />
                                Publish Now
                              </>
                            ) : (
                              <>
                                <EyeOff className="mr-2 h-4 w-4" />
                                Save as Draft
                              </>
                            )}
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          if (isDirty) {
                            if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
                              router.back();
                            }
                          } else {
                            router.back();
                          }
                        }}
                        disabled={loading}
                        className="w-full"
                      >
                        Cancel
                      </Button>
                    </CardFooter>
                  </Card>

                  {/* Categories Card */}
                  <Card className="shadow-sm border">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Tag className="h-5 w-5 text-primary" />
                        Categories *
                      </CardTitle>
                      <CardDescription>
                        Select relevant categories for your news
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <Select onValueChange={handleCategorySelect}>
                          <SelectTrigger className="w-full">
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
                          <div className="flex flex-wrap gap-2 mt-3">
                            {selectedCategories.map((catId) => {
                              const cat = categories.find((c) => c.id === catId);
                              return cat ? (
                                <Badge 
                                  key={catId} 
                                  variant="secondary" 
                                  className="gap-1 py-1.5 px-3 text-xs"
                                >
                                  {cat.name}
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <X
                                        className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors"
                                        onClick={() => handleCategoryRemove(catId)}
                                      />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Remove category</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        )}
                        
                        {errors.categoryIds && (
                          <p className="text-sm text-destructive flex items-center gap-1 mt-2">
                            <X className="h-3 w-3" />
                            {errors.categoryIds.message}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Status Card */}
                  <Card className="shadow-sm border">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg">Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Form Status</span>
                        <Badge variant={isValid ? "default" : "destructive"}>
                          {isValid ? "Valid" : "Invalid"}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Changes</span>
                        <Badge variant={isDirty ? "default" : "secondary"}>
                          {isDirty ? "Unsaved" : "No changes"}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Categories</span>
                        <Badge variant="outline">
                          {selectedCategories.length} selected
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </TooltipProvider>
  );
}