"use client";

import { useState } from "react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Search, Eye, Flame, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { deleteNews } from "@/lib/actions/news";
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

/**
 * News Table Component
 */
interface News {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  isPublished: boolean;
  isActive: boolean;
  isBreaking: boolean;
  isFeatured: boolean;
  viewCount: number;
  author: {
    id: string;
    username: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  editor: {
    id: string;
    username: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  categories: Array<{
    menu: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
}

interface NewsTableProps {
  news: News[];
  total: number;
  page: number;
  totalPages: number;
  search?: string;
}

export function NewsTable({ news, total, page, totalPages, search: initialSearch }: NewsTableProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [search, setSearch] = useState(initialSearch || "");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newsToDelete, setNewsToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    params.set("page", "1");
    router.push(`/dashboard/news?${params.toString()}`);
  };

  const handleDelete = async () => {
    if (!newsToDelete) return;

    setDeleting(true);
    const result = await deleteNews(newsToDelete);
    setDeleting(false);
    setDeleteDialogOpen(false);
    setNewsToDelete(null);

    if (result.success) {
      toast({
        title: "News deleted",
        description: "The news post has been successfully deleted.",
      });
      router.refresh();
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to delete news post",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Search news posts..."
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
                <TableHead>Title</TableHead>
                <TableHead>Categories</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {news.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No news posts found. Create your first news post!
                  </TableCell>
                </TableRow>
              ) : (
                news.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{item.title}</p>
                          {item.isBreaking && (
                            <Badge variant="destructive" className="gap-1">
                              <Flame className="h-3 w-3" />
                              Breaking
                            </Badge>
                          )}
                          {item.isFeatured && (
                            <Badge variant="default" className="gap-1">
                              <Star className="h-3 w-3" />
                              Featured
                            </Badge>
                          )}
                        </div>
                        {item.excerpt && (
                          <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                            {item.excerpt}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {item.categories.slice(0, 2).map((cat) => (
                          <Badge key={cat.menu.id} variant="outline" className="text-xs">
                            {cat.menu.name}
                          </Badge>
                        ))}
                        {item.categories.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{item.categories.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Badge variant={item.isPublished ? "default" : "secondary"}>
                          {item.isPublished ? "Published" : "Draft"}
                        </Badge>
                        {!item.isActive && (
                          <Badge variant="destructive">Inactive</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{item.viewCount}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="font-medium">
                          {item.author.firstName || item.author.lastName
                            ? `${item.author.firstName || ""} ${item.author.lastName || ""}`.trim()
                            : item.author.username}
                        </p>
                        {item.editor && (
                          <p className="text-xs text-muted-foreground">
                            Edited by {item.editor.username}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(item.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/news/${item.slug}`} target="_blank">
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/dashboard/news/${item.id}/edit`}>
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setNewsToDelete(item.id);
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
              Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, total)} of {total} news posts
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => {
                  const params = new URLSearchParams();
                  if (search) params.set("search", search);
                  params.set("page", String(page - 1));
                  router.push(`/dashboard/news?${params.toString()}`);
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
                  router.push(`/dashboard/news?${params.toString()}`);
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
            <DialogTitle>Delete News Post</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this news post? This action cannot be undone.
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

