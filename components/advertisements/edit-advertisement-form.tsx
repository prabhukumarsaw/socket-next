"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateAdvertisement } from "@/lib/actions/advertisements";
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
import { X } from "lucide-react";
import { datetimeLocalToISO, isoToDatetimeLocal, validateDateRange } from "@/lib/utils/datetime-utils";

// Custom datetime validation for datetime-local input
const datetimeLocalSchema = z
  .string()
  .refine(
    (val) => {
      if (!val) return true; // Optional
      try {
        const date = new Date(val);
        return !isNaN(date.getTime());
      } catch {
        return false;
      }
    },
    { message: "Invalid datetime format" }
  )
  .optional();

const updateAdvertisementSchema = z
  .object({
    id: z.string(),
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    imageUrl: z.string().url().optional().or(z.literal("")),
    linkUrl: z.string().url().optional().or(z.literal("")),
    zone: z.string().min(1).optional(),
    position: z.number().int().optional(),
    isActive: z.boolean().optional(),
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

type UpdateAdvertisementFormData = z.infer<typeof updateAdvertisementSchema>;

const AD_ZONES = [
  { value: "header", label: "Header" },
  { value: "sidebar", label: "Sidebar" },
  { value: "footer", label: "Footer" },
  { value: "inline", label: "Inline" },
  { value: "popup", label: "Popup" },
];

interface EditAdvertisementFormProps {
  advertisement: {
    id: string;
    title: string;
    description: string | null;
    imageUrl: string;
    linkUrl: string | null;
    zone: string;
    position: number;
    isActive: boolean;
    startDate: Date;
    endDate: Date;
    newsId: string | null;
  };
}

export function EditAdvertisementForm({ advertisement }: EditAdvertisementFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [newsPosts, setNewsPosts] = useState<Array<{ id: string; title: string }>>([]);

  useEffect(() => {
    async function loadNews() {
      const result = await getUserNews(1, 100);
      if (result.success) {
        setNewsPosts(result.news.map((n) => ({ id: n.id, title: n.title })));
      }
    }
    loadNews();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<UpdateAdvertisementFormData>({
    resolver: zodResolver(updateAdvertisementSchema),
    defaultValues: {
      id: advertisement.id,
      title: advertisement.title,
      description: advertisement.description || "",
      imageUrl: advertisement.imageUrl,
      linkUrl: advertisement.linkUrl || "",
      zone: advertisement.zone,
      position: advertisement.position,
      isActive: advertisement.isActive,
      startDate: isoToDatetimeLocal(advertisement.startDate.toISOString()),
      endDate: isoToDatetimeLocal(advertisement.endDate.toISOString()),
      newsId: advertisement.newsId || "",
    },
  });

  const onSubmit = async (data: UpdateAdvertisementFormData) => {
    setLoading(true);
    try {
      // Transform datetime-local format to ISO format if dates are provided
      const transformedData = {
        ...data,
        startDate: data.startDate ? datetimeLocalToISO(data.startDate) : undefined,
        endDate: data.endDate ? datetimeLocalToISO(data.endDate) : undefined,
      };
      
      const result = await updateAdvertisement(transformedData);

      if (result.success) {
        toast({
          title: "Advertisement updated",
          description: "Your advertisement has been successfully updated.",
        });
        router.push("/dashboard/advertisements");
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update advertisement",
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
    <div className="container mx-auto max-w-4xl px-4 py-6">
      <Card className="border-2 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
          <CardTitle className="text-2xl font-bold">Edit Advertisement</CardTitle>
          <CardDescription className="text-purple-100">
            Update the advertisement information below
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register("title")} disabled={loading} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              disabled={loading}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Advertisement Image</Label>
            <div className="space-y-2">
              <MediaPicker
                value={watch("imageUrl") || ""}
                onSelect={(url) => setValue("imageUrl", url)}
                type="image"
                label="Select Advertisement Image"
              />
              {watch("imageUrl") && (
                <div className="relative w-full h-48 bg-muted rounded-lg overflow-hidden border">
                  <OptimizedImage
                    src={watch("imageUrl")}
                    alt="Ad preview"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => setValue("imageUrl", "")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkUrl">Link URL</Label>
            <Input id="linkUrl" type="url" {...register("linkUrl")} disabled={loading} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="zone">Zone</Label>
              <Select
                onValueChange={(value) => setValue("zone", value)}
                defaultValue={advertisement.zone}
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                type="number"
                {...register("position", { valueAsNumber: true })}
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-sm font-semibold">
                Start Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="startDate"
                type="datetime-local"
                {...register("startDate")}
                disabled={loading}
                className="h-11"
              />
              {errors.startDate && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <span>⚠</span> {errors.startDate.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-sm font-semibold">
                End Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="endDate"
                type="datetime-local"
                {...register("endDate")}
                disabled={loading}
                className="h-11"
              />
              {errors.endDate && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <span>⚠</span> {errors.endDate.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newsId">Link to News Post</Label>
            <Select
              onValueChange={(value) => setValue("newsId", value || undefined)}
              defaultValue={advertisement.newsId || ""}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a news post" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {newsPosts.map((news) => (
                  <SelectItem key={news.id} value={news.id}>
                    {news.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

          <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
            <Button 
              type="submit" 
              disabled={loading}
              className="flex-1 sm:flex-none bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold h-11"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Advertisement
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
              className="flex-1 sm:flex-none h-11"
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

