"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, Folder, FolderOpen, File, Plus, Edit, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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

interface MenusTreeProps {
  menus: Menu[];
  onEdit: (menu: Menu) => void;
  onDelete: (menuId: string) => void;
  onAddChild?: (parentId: string) => void;
  onAddRoot?: () => void;
}

export function MenusTree({ menus, onEdit, onDelete, onAddChild, onAddRoot }: MenusTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Build tree structure
  const buildTree = (items: Menu[], parentId: string | null = null): Menu[] => {
    return items
      .filter((item) => item.parentId === parentId)
      .sort((a, b) => a.order - b.order)
      .map((item) => ({
        ...item,
        children: buildTree(items, item.id),
      }));
  };

  const tree = buildTree(menus);

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpanded(newExpanded);
  };

  const renderMenu = (menu: Menu, level: number = 0) => {
    const hasChildren = menu.children.length > 0;
    const isExpanded = expanded.has(menu.id);
    const indent = level * 24;

    return (
      <div key={menu.id} className="select-none">
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent group",
            !menu.isActive && "opacity-50"
          )}
          style={{ paddingLeft: `${12 + indent}px` }}
        >
          <div className="flex items-center gap-1 flex-1 min-w-0">
            {hasChildren ? (
              <button
                onClick={() => toggleExpand(menu.id)}
                className="p-0.5 hover:bg-accent rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            ) : (
              <div className="w-5" />
            )}

            <div className="flex items-center gap-2 flex-1 min-w-0">
              {hasChildren ? (
                isExpanded ? (
                  <FolderOpen className="h-4 w-4 text-primary flex-shrink-0" />
                ) : (
                  <Folder className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )
              ) : (
                <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{menu.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {menu.slug}
                  </Badge>
                  {menu.isPublic && (
                    <Badge variant="secondary" className="text-xs">
                      Public
                    </Badge>
                  )}
                  {!menu.isActive && (
                    <Badge variant="destructive" className="text-xs">
                      Inactive
                    </Badge>
                  )}
                </div>
                {menu.path && (
                  <p className="text-xs text-muted-foreground truncate">{menu.path}</p>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {menu.roleCount > 0 && (
                  <span className="hidden sm:inline">Roles: {menu.roleCount}</span>
                )}
                {menu.newsCount > 0 && (
                  <span className="hidden sm:inline">News: {menu.newsCount}</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {onAddChild && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onAddChild(menu.id)}
                  title="Add child menu"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onEdit(menu)}
                title="Edit menu"
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive"
                onClick={() => onDelete(menu.id)}
                title="Delete menu"
                disabled={hasChildren}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="ml-6">
            {menu.children.map((child) => renderMenu(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-1">
      {tree.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No menus found. Create your first menu!
        </div>
      ) : (
        tree.map((menu) => renderMenu(menu, 0))
      )}
    </div>
  );
}

