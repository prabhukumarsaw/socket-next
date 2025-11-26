import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "./jwt-server";

/**
 * Permission Management System
 * Handles role-based access control (RBAC) and permission checking
 */

export const SUPERADMIN_ROLE = "superadmin";

/**
 * Check if user has a specific permission
 * @param userId - User ID
 * @param permissionSlug - Permission slug to check (e.g., "user.create")
 * @returns Boolean indicating if user has permission
 */
export async function hasPermission(
  userId: string,
  permissionSlug: string
): Promise<boolean> {
  // Superadmin has all permissions
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });

  // Check if user is superadmin
  const isSuperadmin = userRoles.some(
    (ur: any) => ur.role.slug === SUPERADMIN_ROLE && ur.role.isActive
  );

  if (isSuperadmin) return true;

  // Check if user has the specific permission
  for (const userRole of userRoles) {
    if (!userRole.role.isActive) continue;

    const hasPermission = userRole.role.permissions.some(
      (rp: any) => rp.permission.slug === permissionSlug && rp.permission.isActive
    );

    if (hasPermission) return true;
  }

  return false;
}

/**
 * Check if user has access to a menu
 * @param userId - User ID
 * @param menuSlug - Menu slug to check
 * @returns Boolean indicating if user has menu access
 */
export async function hasMenuAccess(userId: string, menuSlug: string): Promise<boolean> {
  // Superadmin has access to all menus
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          menus: {
            include: {
              menu: true,
            },
          },
        },
      },
    },
  });

  const isSuperadmin = userRoles.some(
    (ur: any) => ur.role.slug === SUPERADMIN_ROLE && ur.role.isActive
  );

  if (isSuperadmin) return true;

  // Check if user's role has access to the menu
  for (const userRole of userRoles) {
    if (!userRole.role.isActive) continue;

    const hasAccess = userRole.role.menus.some(
      (rm: any) => rm.menu.slug === menuSlug && rm.menu.isActive
    );

    if (hasAccess) return true;
  }

  return false;
}

/**
 * Get all permissions for a user
 * @param userId - User ID
 * @returns Array of permission slugs
 */
export async function getUserPermissions(userId: string): Promise<string[]> {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });

  const isSuperadmin = userRoles.some(
    (ur: any) => ur.role.slug === SUPERADMIN_ROLE && ur.role.isActive
  );

  if (isSuperadmin) {
    // Return all active permissions for superadmin
    const allPermissions = await prisma.permission.findMany({
      where: { isActive: true },
      select: { slug: true },
    });
    return allPermissions.map((p: any) => p.slug);
  }

  // Collect unique permissions from user's roles
  const permissions = new Set<string>();
  for (const userRole of userRoles) {
    if (!userRole.role.isActive) continue;

    userRole.role.permissions.forEach((rp: any) => {
      if (rp.permission.isActive) {
        permissions.add(rp.permission.slug);
      }
    });
  }

  return Array.from(permissions);
}

/**
 * Get all accessible menus for a user
 * @param userId - User ID
 * @returns Array of menu objects
 */
export async function getUserMenus(userId: string) {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          menus: {
            include: {
              menu: {
                include: {
                  children: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const isSuperadmin = userRoles.some(
    (ur: any) => ur.role.slug === SUPERADMIN_ROLE && ur.role.isActive
  );

  if (isSuperadmin) {
    // Return all active menus for superadmin (excluding public menus - those are for news categories)
    return await prisma.menu.findMany({
      where: { 
        isActive: true,
        isPublic: false, // Dashboard should not show public menus (news categories)
      },
      orderBy: { order: "asc" },
      include: {
        children: {
          where: { 
            isActive: true,
            isPublic: false, // Also filter children
          },
          orderBy: { order: "asc" },
        },
      },
    });
  }

  // Collect unique menus from user's roles (excluding public menus)
  const menuMap = new Map<string, any>();
  for (const userRole of userRoles) {
    if (!userRole.role.isActive) continue;

    userRole.role.menus.forEach((rm: any) => {
      // Only include non-public menus for dashboard navigation
      if (rm.menu.isActive && !rm.menu.isPublic && !menuMap.has(rm.menu.id)) {
        menuMap.set(rm.menu.id, rm.menu);
      }
    });
  }

  // Filter children to exclude public menus
  const filteredMenus = Array.from(menuMap.values()).map((menu: any) => ({
    ...menu,
    children: menu.children?.filter((child: any) => !child.isPublic) || [],
  }));

  return filteredMenus.sort((a, b) => a.order - b.order);
}

/**
 * Check if current user has permission (from JWT)
 * @param permissionSlug - Permission slug to check
 * @returns Boolean indicating if current user has permission
 */
export async function checkPermission(permissionSlug: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  return hasPermission(user.userId, permissionSlug);
}

