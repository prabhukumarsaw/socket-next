"use client";

import { useState, useEffect } from "react";
import { getMenus, createMenu, updateMenu, deleteMenu } from "@/lib/actions/menus";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { MenusTree } from "@/components/menus/menus-tree";
import { MenuForm } from "@/components/menus/menu-form";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PageContainer from "@/components/layout/page-container";

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
  parent?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  children: Menu[];
  roleCount: number;
  newsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export default function MenusPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [parentId, setParentId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [menuToDelete, setMenuToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadMenus();
  }, []);

  const loadMenus = async () => {
    setLoading(true);
    const result:any = await getMenus();
    if (result.success) {
      setMenus(result.menus);
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to load menus",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const handleCreate = () => {
    setEditingMenu(null);
    setParentId(null);
    setShowForm(true);
  };

  const handleAddChild = (parentId: string) => {
    setEditingMenu(null);
    setParentId(parentId);
    setShowForm(true);
  };

  const handleEdit = (menu: Menu) => {
    setEditingMenu(menu);
    setParentId(null);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!menuToDelete) return;

    setDeleting(true);
    const result = await deleteMenu(menuToDelete);
    setDeleting(false);
    setDeleteDialogOpen(false);
    setMenuToDelete(null);

    if (result.success) {
      toast({
        title: "Menu deleted",
        description: "The menu has been successfully deleted.",
      });
      loadMenus();
      router.refresh();
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to delete menu",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (data: any) => {
    setSaving(true);
    try {
      let result;
      if (data.id) {
        result = await updateMenu(data);
      } else {
        // Set parentId if adding child
        if (parentId) {
          data.parentId = parentId;
        }
        result = await createMenu(data);
      }

      if (result.success) {
        toast({
          title: data.id ? "Menu updated" : "Menu created",
          description: `The menu has been successfully ${data.id ? "updated" : "created"}.`,
        });
        setShowForm(false);
        setEditingMenu(null);
        setParentId(null);
        loadMenus();
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: result.error || `Failed to ${data.id ? "update" : "create"} menu`,
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
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading menus...</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Menu Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage navigation menus and categories. Public menus are used as news categories.
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create Menu
          </Button>
        </div>

        {showForm ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {editingMenu ? "Edit Menu" : parentId ? "Add Child Menu" : "Create Menu"}
              </h2>
              <Button variant="ghost" size="icon" onClick={() => {
                setShowForm(false);
                setEditingMenu(null);
                setParentId(null);
              }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <MenuForm
              menu={editingMenu}
              menus={menus}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingMenu(null);
                setParentId(null);
              }}
              loading={saving}
            />
          </div>
        ) : (
          <div className="rounded-lg border bg-card p-4">
            <MenusTree
              menus={menus}
              onEdit={handleEdit}
              onDelete={(id) => {
                setMenuToDelete(id);
                setDeleteDialogOpen(true);
              }}
              onAddChild={handleAddChild}
              onAddRoot={handleCreate}
            />
          </div>
        )}

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Menu</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this menu? This action cannot be undone.
                If this menu has child menus, you must delete or move them first.
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
      </div>
    </PageContainer>
  );
}

