"use client";

import { useState } from "react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Search, Eye, MousePointerClick, Eye as EyeIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { deleteAdvertisement } from "@/lib/actions/advertisements";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import NextImage from "next/image";

/**
 * Advertisements Table Component
 */
interface Advertisement {
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
  clicks: number;
  impressions: number;
  author: {
    id: string;
    username: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  news: {
    id: string;
    title: string;
    slug: string;
  } | null;
  createdAt: Date;
}

interface AdvertisementsTableProps {
  advertisements: Advertisement[];
  total: number;
  page: number;
  totalPages: number;
  search?: string;
}

export function AdvertisementsTable({ 
  advertisements, 
  total, 
  page, 
  totalPages, 
  search: initialSearch 
}: any) {
  const router = useRouter();
  const { toast } = useToast();
  const [search, setSearch] = useState(initialSearch || "");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [adToDelete, setAdToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    params.set("page", "1");
    router.push(`/dashboard/advertisements?${params.toString()}`);
  };

  const handleDelete = async () => {
    if (!adToDelete) return;

    setDeleting(true);
    const result = await deleteAdvertisement(adToDelete);
    setDeleting(false);
    setDeleteDialogOpen(false);
    setAdToDelete(null);

    if (result.success) {
      toast({
        title: "Advertisement deleted",
        description: "The advertisement has been successfully deleted.",
      });
      router.refresh();
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to delete advertisement",
        variant: "destructive",
      });
    }
  };

  const isActive = (ad: Advertisement) => {
    const now = new Date();
    return ad.isActive && ad.startDate <= now && ad.endDate >= now;
  };

  return (
    <>
      <div className="space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Search advertisements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <Button type="submit" variant="outline">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </form>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Preview</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Zone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Date Range</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {advertisements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No advertisements found. Create your first advertisement!
                  </TableCell>
                </TableRow>
              ) : (
                advertisements.map((ad:any) => (
                  <TableRow key={ad.id}>
                    <TableCell>
                      <div className="relative w-20 h-20">
                        <NextImage
                          src={ad.imageUrl}
                          alt={ad.title}
                          fill
                          className="object-cover rounded"
                          sizes="80px"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{ad.title}</p>
                        {ad.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {ad.description}
                          </p>
                        )}
                        {ad.news && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Linked to: {ad.news.title}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{ad.zone}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        Position: {ad.position}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant={isActive(ad) ? "default" : "secondary"}>
                          {isActive(ad) ? "Active" : "Inactive"}
                        </Badge>
                        {!ad.isActive && (
                          <Badge variant="destructive">Disabled</Badge>
                        )}
                        {new Date() < ad.startDate && (
                          <Badge variant="outline">Scheduled</Badge>
                        )}
                        {new Date() > ad.endDate && (
                          <Badge variant="outline">Expired</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-1">
                          <EyeIcon className="h-3 w-3" />
                          <span>{ad.impressions.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MousePointerClick className="h-3 w-3" />
                          <span>{ad.clicks.toLocaleString()}</span>
                        </div>
                        {ad.impressions > 0 && (
                          <p className="text-xs text-muted-foreground">
                            CTR: {((ad.clicks / ad.impressions) * 100).toFixed(2)}%
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{formatDate(ad.startDate)}</p>
                        <p className="text-muted-foreground">to</p>
                        <p>{formatDate(ad.endDate)}</p>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(ad.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {ad.linkUrl && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => window.open(ad.linkUrl!, "_blank")}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Link href={`/dashboard/advertisements/${ad.id}/edit`}>
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setAdToDelete(ad.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, total)} of {total} advertisements
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => {
                  const params = new URLSearchParams();
                  if (search) params.set("search", search);
                  params.set("page", String(page - 1));
                  router.push(`/dashboard/advertisements?${params.toString()}`);
                }}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => {
                  const params = new URLSearchParams();
                  if (search) params.set("search", search);
                  params.set("page", String(page + 1));
                  router.push(`/dashboard/advertisements?${params.toString()}`);
                }}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Advertisement</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this advertisement? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

