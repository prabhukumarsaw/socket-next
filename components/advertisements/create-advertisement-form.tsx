"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createAdvertisement } from "@/lib/actions/advertisements";
import { getUserNews } from "@/lib/actions/news";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MediaPicker } from "@/components/media/media-picker";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { X, Image as ImageIcon, Link2, Calendar, MapPin, Settings, Eye, EyeOff } from "lucide-react";
import { datetimeLocalToISO, validateDateRange } from "@/lib/utils/datetime-utils";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useCallback } from "react";

// Custom URL validation that accepts absolute URLs, relative URLs (starting with /), or empty strings
const urlOrEmpty = z.preprocess(
  (val) => (val === "" || val === null || val === undefined ? "" : val),
  z.union([
    z.literal(""), // Empty string first
    z.string().regex(/^\/.*/, "Relative URL must start with /"), // Relative URLs
    z.string().url("Please enter a valid URL"), // Absolute URLs
  ])
).optional();

// Custom datetime validation for datetime-local input
const datetimeLocalSchema = z
  .string()
  .min(1, "Date is required")
  .refine(
    (val) => {
      try {
        const date = new Date(val);
        return !isNaN(date.getTime());
      } catch {
        return false;
      }
    },
    { message: "Invalid datetime format" }
  );

const createAdvertisementSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    imageUrl: urlOrEmpty,
    linkUrl: z.string().url().optional().or(z.literal("")),
    zone: z.string().min(1, "Zone is required"),
    position: z.number().int().default(0),
    startDate: datetimeLocalSchema,
    endDate: datetimeLocalSchema,
    newsId: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) return true;
      try {
        const startISO = datetimeLocalToISO(data.startDate);
        const endISO = datetimeLocalToISO(data.endDate);
        return validateDateRange(startISO, endISO);
      } catch {
        return false;
      }
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    }
  );

type CreateAdvertisementFormData = z.infer<typeof createAdvertisementSchema>;

const AD_ZONES = [
  { value: "header", label: "Header" },
  { value: "sidebar", label: "Sidebar" },
  { value: "footer", label: "Footer" },
  { value: "inline", label: "Inline" },
  { value: "popup", label: "Popup" },
];

export function CreateAdvertisementForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [newsPosts, setNewsPosts] = useState<Array<{ id: string; title: string }>>([]);

  useEffect(() => {
    async function loadNews() {
      const result = await getUserNews(1, 100);
      if (result.success && result.news) {
        setNewsPosts(result.news.map((n: typeof result.news[number]) => ({ id: n.id, title: n.title })));
      }
    }
    loadNews();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isValid },
    watch,
    setValue,
    trigger,
  } = useForm<CreateAdvertisementFormData>({
    resolver: zodResolver(createAdvertisementSchema),
    defaultValues: {
      position: 0,
      zone: "sidebar",
    },
    mode: "onChange",
  });

  const handleImageSelect = useCallback((url: string) => {
    // Normalize the URL to ensure it starts with / if it's a relative path
    const normalizedUrl = url && !url.startsWith("http") && !url.startsWith("/") ? `/${url}` : url;
    setValue("imageUrl", normalizedUrl || "", { shouldValidate: true, shouldDirty: true });
    // Trigger validation to clear any previous errors
    trigger("imageUrl");
  }, [setValue, trigger]);

  const handleImageRemove = useCallback(() => {
    setValue("imageUrl", "", { shouldValidate: true, shouldDirty: true });
    trigger("imageUrl");
  }, [setValue, trigger]);

  const onSubmit = async (data: CreateAdvertisementFormData) => {
    setLoading(true);
    try {
      // Transform datetime-local format to ISO format
      const transformedData = {
        ...data,
        startDate: datetimeLocalToISO(data.startDate),
        endDate: datetimeLocalToISO(data.endDate),
        imageUrl: data.imageUrl ?? "",
      };
      
      const result = await createAdvertisement(transformedData);

      if (result.success) {
        toast({
          title: "Advertisement created",
          description: "Your advertisement has been successfully created.",
        });
        router.push("/dashboard/advertisements");
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create advertisement",
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

  // Set default dates
  const now = new Date();
  const defaultStartDate = now.toISOString().slice(0, 16);
  const defaultEndDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);

  const imageUrl = watch("imageUrl");

  return (
    <div className="min-h-screen bg-background py-6">
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 xl:grid-cols-10 gap-2 lg:gap-4">
            {/* Main Content Area - 70% width on desktop */}
            <div className="xl:col-span-7 space-y-4 lg:space-y-6">
              {/* Basic Information Card */}
              <Card className="shadow-sm border">
                <CardHeader className="pb-0">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Settings className="h-5 w-5 text-primary" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="title" className="text-base font-medium">Title *</Label>
                    <Input
                      id="title"
                      placeholder="Advertisement Title"
                      {...register("title")}
                      disabled={loading}
                      className="h-12"
                    />
                    {errors.title && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <X className="h-3 w-3" />
                        {errors.title.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="description" className="text-base font-medium">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Advertisement description..."
                      {...register("description")}
                      disabled={loading}
                      rows={4}
                      className="resize-none"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Media Section */}
              <Card className="shadow-sm border">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ImageIcon className="h-5 w-5 text-primary" />
                    Advertisement Image
                  </CardTitle>
                  <CardDescription>
                    Select an image from your media library or upload a new one
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <MediaPicker
                    value={imageUrl || ""}
                    onSelect={handleImageSelect}
                    type="image"
                    label="Select Advertisement Image"
                    description="Recommended size: 1200x630px"
                  />
                  {imageUrl && (
                    <div className="relative aspect-[3/2] w-full min-h-[200px] overflow-hidden rounded-lg border bg-background">
                      <OptimizedImage
                        src={imageUrl}
                        alt="Ad preview"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 z-10"
                        onClick={handleImageRemove}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  {errors.imageUrl && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <X className="h-3 w-3" />
                      {errors.imageUrl.message}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Link & Settings Card */}
              <Card className="shadow-sm border">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Link2 className="h-5 w-5 text-primary" />
                    Link & Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="linkUrl" className="text-base font-medium">Link URL</Label>
                    <Input
                      id="linkUrl"
                      type="url"
                      placeholder="https://example.com"
                      {...register("linkUrl")}
                      disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground">
                      URL to redirect when ad is clicked (optional)
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <Label htmlFor="zone" className="text-base font-medium">Zone *</Label>
                      <Select
                        onValueChange={(value) => setValue("zone", value, { shouldValidate: true })}
                        defaultValue="sidebar"
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select zone" />
                        </SelectTrigger>
                        <SelectContent>
                          {AD_ZONES.map((zone) => (
                            <SelectItem key={zone.value} value={zone.value}>
                              {zone.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.zone && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <X className="h-3 w-3" />
                          {errors.zone.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="position" className="text-base font-medium">Position</Label>
                      <Input
                        id="position"
                        type="number"
                        placeholder="0"
                        {...register("position", { valueAsNumber: true })}
                        disabled={loading}
                      />
                      <p className="text-xs text-muted-foreground">
                        Order within the zone
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Schedule Card */}
              <Card className="shadow-sm border">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="h-5 w-5 text-primary" />
                    Schedule
                  </CardTitle>
                  <CardDescription>
                    Set when your advertisement should be displayed
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <Label htmlFor="startDate" className="text-base font-medium">
                        Start Date *
                      </Label>
                      <Input
                        id="startDate"
                        type="datetime-local"
                        defaultValue={defaultStartDate}
                        {...register("startDate")}
                        disabled={loading}
                        className="h-11"
                      />
                      {errors.startDate && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <X className="h-3 w-3" />
                          {errors.startDate.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="endDate" className="text-base font-medium">
                        End Date *
                      </Label>
                      <Input
                        id="endDate"
                        type="datetime-local"
                        defaultValue={defaultEndDate}
                        {...register("endDate")}
                        disabled={loading}
                        className="h-11"
                      />
                      {errors.endDate && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <X className="h-3 w-3" />
                          {errors.endDate.message}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Area - 30% width on desktop */}
            <div className="xl:col-span-3 space-y-6 lg:space-y-8">
              <div className="xl:sticky xl:top-6 space-y-6">
                {/* Actions Card */}
                <Card className="shadow-sm border">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Settings className="h-5 w-5 text-primary" />
                      Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button 
                      type="submit" 
                      disabled={loading || !isValid}
                      className="w-full h-11 text-base font-semibold"
                      size="lg"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <ImageIcon className="mr-2 h-4 w-4" />
                          Create Advertisement
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                      disabled={loading}
                      className="w-full"
                    >
                      Cancel
                    </Button>
                  </CardContent>
                </Card>

                {/* Additional Settings Card */}
                <Card className="shadow-sm border">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Additional Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <Label htmlFor="newsId" className="text-base font-medium">Link to News Post</Label>
                      <Select onValueChange={(value) => setValue("newsId", value === "none" ? undefined : value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a news post" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {newsPosts.map((news) => (
                            <SelectItem key={news.id} value={news.id}>
                              {news.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

