"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/jwt-server";
import { hasPermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/audit-log";
import { revalidatePath } from "next/cache";
import { z } from "zod";

/**
 * Server Actions for Menu Management
 */

const createMenuSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  path: z.string().optional(),
  icon: z.string().optional(),
  parentId: z.string().optional().nullable(),
  order: z.number().int().default(0),
  isPublic: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

const updateMenuSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  path: z.string().optional(),
  icon: z.string().optional(),
  parentId: z.string().optional().nullable(),
  order: z.number().int().optional(),
  isPublic: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

/**
 * Get all menus (for dashboard - shows all, not filtered by isPublic)
 */
export async function getMenus() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    // Check permission
    const hasAccess = await hasPermission(currentUser.userId, "menu.read");
    if (!hasAccess) {
      return { success: false, error: "You don't have permission to view menus" };
    }

    const menus = await prisma.menu.findMany({
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        children: {
          orderBy: { order: "asc" },
        },
        _count: {
          select: {
            roles: true,
            news: true,
          },
        },
      },
      orderBy: [{ parentId: "asc" }, { order: "asc" }],
    });

    return {
      success: true,
      menus: menus.map((menu: any) => ({
        id: menu.id,
        name: menu.name,
        slug: menu.slug,
        path: menu.path,
        icon: menu.icon,
        parentId: menu.parentId,
        order: menu.order,
        isPublic: menu.isPublic,
        isActive: menu.isActive,
        parent: menu.parent,
        children: menu.children,
        roleCount: menu._count.roles,
        newsCount: menu._count.news,
        createdAt: menu.createdAt,
        updatedAt: menu.updatedAt,
      })),
    };
  } catch (error) {
    console.error("Get menus error:", error);
    return { success: false, error: "Failed to fetch menus" };
  }
}

/**
 * Get menu by ID
 */
export async function getMenuById(menuId: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const hasAccess = await hasPermission(currentUser.userId, "menu.read");
    if (!hasAccess) {
      return { success: false, error: "You don't have permission to view menus" };
    }

    const menu = await prisma.menu.findUnique({
      where: { id: menuId },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        children: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!menu) {
      return { success: false, error: "Menu not found" };
    }

    return {
      success: true,
      menu,
    };
  } catch (error) {
    console.error("Get menu error:", error);
    return { success: false, error: "Failed to fetch menu" };
  }
}

/**
 * Create a new menu
 */
export async function createMenu(data: z.infer<typeof createMenuSchema>) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const hasAccess = await hasPermission(currentUser.userId, "menu.create");
    if (!hasAccess) {
      return { success: false, error: "You don't have permission to create menus" };
    }

    const validated = createMenuSchema.parse(data);

    // Normalize parentId: convert empty string, "none", or undefined to null
    const normalizedParentId = 
      !validated.parentId || validated.parentId === "none" || (typeof validated.parentId === "string" && validated.parentId.trim() === "")
        ? null
        : validated.parentId;

    // Check if slug already exists
    const existingSlug = await prisma.menu.findUnique({
      where: { slug: validated.slug },
    });
    if (existingSlug) {
      return { success: false, error: "A menu with this slug already exists" };
    }

    // Verify parent exists if provided (and not null)
    if (normalizedParentId) {
      const parent = await prisma.menu.findUnique({
        where: { id: normalizedParentId },
      });
      if (!parent) {
        return { success: false, error: "Parent menu not found" };
      }
    }

    const menu = await prisma.menu.create({
      data: {
        name: validated.name,
        slug: validated.slug,
        path: validated.path,
        icon: validated.icon,
        parentId: normalizedParentId,
        order: validated.order,
        isPublic: validated.isPublic,
        isActive: validated.isActive,
      },
      include: {
        parent: true,
        children: true,
      },
    });

    await createAuditLog({
      action: "CREATE_MENU",
      resource: "Menu",
      resourceId: menu.id,
      description: `User ${currentUser.email} created menu: ${menu.name}`,
    });

    revalidatePath("/dashboard/menus");

    return { success: true, menu };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    console.error("Create menu error:", error);
    return { success: false, error: "Failed to create menu" };
  }
}

/**
 * Update a menu
 */
export async function updateMenu(data: z.infer<typeof updateMenuSchema>) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const hasAccess = await hasPermission(currentUser.userId, "menu.update");
    if (!hasAccess) {
      return { success: false, error: "You don't have permission to update menus" };
    }

    const validated = updateMenuSchema.parse(data);

    const existingMenu = await prisma.menu.findUnique({
      where: { id: validated.id },
    });

    if (!existingMenu) {
      return { success: false, error: "Menu not found" };
    }

    // Check slug uniqueness if changing
    if (validated.slug && validated.slug !== existingMenu.slug) {
      const slugExists = await prisma.menu.findUnique({
        where: { slug: validated.slug },
      });
      if (slugExists) {
        return { success: false, error: "A menu with this slug already exists" };
      }
    }

    // Normalize parentId: convert empty string, "none", or undefined to null
    const normalizedParentId = 
      !validated.parentId || validated.parentId === "none" || (typeof validated.parentId === "string" && validated.parentId.trim() === "")
        ? null
        : validated.parentId;

    // Prevent circular references
    if (normalizedParentId && normalizedParentId === validated.id) {
      return { success: false, error: "A menu cannot be its own parent" };
    }

    // Verify parent exists if provided (and not null)
    if (normalizedParentId) {
      const parent = await prisma.menu.findUnique({
        where: { id: normalizedParentId },
      });
      if (!parent) {
        return { success: false, error: "Parent menu not found" };
      }

      // Check for circular reference in children
      const wouldCreateCycle = await checkMenuCycle(validated.id, normalizedParentId);
      if (wouldCreateCycle) {
        return { success: false, error: "This would create a circular reference" };
      }
    }

    const updateData: any = {};
    if (validated.name) updateData.name = validated.name;
    if (validated.slug) updateData.slug = validated.slug;
    if (validated.path !== undefined) updateData.path = validated.path;
    if (validated.icon !== undefined) updateData.icon = validated.icon;
    // Always set parentId (even if null) to allow removing parent
    updateData.parentId = normalizedParentId;
    if (validated.order !== undefined) updateData.order = validated.order;
    if (validated.isPublic !== undefined) updateData.isPublic = validated.isPublic;
    if (validated.isActive !== undefined) updateData.isActive = validated.isActive;

    const menu = await prisma.menu.update({
      where: { id: validated.id },
      data: updateData,
      include: {
        parent: true,
        children: true,
      },
    });

    await createAuditLog({
      action: "UPDATE_MENU",
      resource: "Menu",
      resourceId: menu.id,
      description: `User ${currentUser.email} updated menu: ${menu.name}`,
    });

    revalidatePath("/dashboard/menus");

    return { success: true, menu };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    console.error("Update menu error:", error);
    return { success: false, error: "Failed to update menu" };
  }
}

/**
 * Delete a menu
 */
export async function deleteMenu(menuId: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const hasAccess = await hasPermission(currentUser.userId, "menu.delete");
    if (!hasAccess) {
      return { success: false, error: "You don't have permission to delete menus" };
    }

    const menu = await prisma.menu.findUnique({
      where: { id: menuId },
      include: {
        children: true,
      },
    });

    if (!menu) {
      return { success: false, error: "Menu not found" };
    }

    // Check if menu has children
    if (menu.children.length > 0) {
      return {
        success: false,
        error: "Cannot delete menu with child menus. Please delete or move children first.",
      };
    }

    await prisma.menu.delete({
      where: { id: menuId },
    });

    await createAuditLog({
      action: "DELETE_MENU",
      resource: "Menu",
      resourceId: menuId,
      description: `User ${currentUser.email} deleted menu: ${menu.name}`,
    });

    revalidatePath("/dashboard/menus");

    return { success: true };
  } catch (error) {
    console.error("Delete menu error:", error);
    return { success: false, error: "Failed to delete menu" };
  }
}

/**
 * Helper function to check for circular references
 */
async function checkMenuCycle(menuId: string, potentialParentId: string): Promise<boolean> {
  let currentId = potentialParentId;
  const visited = new Set<string>();

  while (currentId) {
    if (currentId === menuId) {
      return true; // Cycle detected
    }
    if (visited.has(currentId)) {
      break; // Already checked this path
    }
    visited.add(currentId);

    const menu = await prisma.menu.findUnique({
      where: { id: currentId },
      select: { parentId: true },
    });

    if (!menu || !menu.parentId) {
      break; // Reached root
    }
    currentId = menu.parentId;
  }

  return false;
}

/**
 * Get public menus (categories for news)
 */
export async function getPublicMenus() {
  try {
    const menus = await prisma.menu.findMany({
      where: { 
        isActive: true,
        isPublic: true, // Only public menus (categories)
      },
      orderBy: { order: "asc" },
    });

    return {
      success: true,
      menus: menus.map((menu: any) => ({
        id: menu.id,
        name: menu.name,
        slug: menu.slug,
        path: menu.path,
      })),
    };
  } catch (error) {
    console.error("Get public menus error:", error);
    return { success: false, error: "Failed to fetch categories" };
  }
}

