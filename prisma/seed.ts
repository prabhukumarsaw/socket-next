// @ts-nocheck

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * Database Seed Script
 * Initializes the database with default roles, permissions, menus, and superadmin user
 */
async function main() {
  console.log("🌱 Seeding database...");

  // Create default permissions
  const permissions = [
    // User permissions
    { name: "Create User", slug: "user.create", resource: "user", action: "create" },
    { name: "Read User", slug: "user.read", resource: "user", action: "read" },
    { name: "Update User", slug: "user.update", resource: "user", action: "update" },
    { name: "Delete User", slug: "user.delete", resource: "user", action: "delete" },
    // Role permissions
    { name: "Create Role", slug: "role.create", resource: "role", action: "create" },
    { name: "Read Role", slug: "role.read", resource: "role", action: "read" },
    { name: "Update Role", slug: "role.update", resource: "role", action: "update" },
    { name: "Delete Role", slug: "role.delete", resource: "role", action: "delete" },
    // Permission permissions
    { name: "Create Permission", slug: "permission.create", resource: "permission", action: "create" },
    { name: "Read Permission", slug: "permission.read", resource: "permission", action: "read" },
    { name: "Update Permission", slug: "permission.update", resource: "permission", action: "update" },
    { name: "Delete Permission", slug: "permission.delete", resource: "permission", action: "delete" },
    // Audit log permissions
    { name: "Read Audit Log", slug: "audit.read", resource: "audit", action: "read" },
    // Blog permissions
    { name: "Create Blog", slug: "blog.create", resource: "blog", action: "create" },
    { name: "Read Own Blog", slug: "blog.read", resource: "blog", action: "read" },
    { name: "Read All Blogs", slug: "blog.read.all", resource: "blog", action: "read.all" },
    { name: "Update Blog", slug: "blog.update", resource: "blog", action: "update" },
    { name: "Delete Blog", slug: "blog.delete", resource: "blog", action: "delete" },
    // News permissions
    { name: "Create News", slug: "news.create", resource: "news", action: "create" },
    { name: "Read Own News", slug: "news.read", resource: "news", action: "read" },
    { name: "Read All News", slug: "news.read.all", resource: "news", action: "read.all" },
    { name: "Update News", slug: "news.update", resource: "news", action: "update" },
    { name: "Delete News", slug: "news.delete", resource: "news", action: "delete" },
    { name: "Publish News", slug: "news.publish", resource: "news", action: "publish" },
    // Media permissions
    { name: "Upload Media", slug: "media.upload", resource: "media", action: "upload" },
    { name: "Read Own Media", slug: "media.read", resource: "media", action: "read" },
    { name: "Read All Media", slug: "media.read.all", resource: "media", action: "read.all" },
    { name: "Delete Media", slug: "media.delete", resource: "media", action: "delete" },
    // Advertisement permissions
    { name: "Create Advertisement", slug: "advertisement.create", resource: "advertisement", action: "create" },
    { name: "Read Own Advertisement", slug: "advertisement.read", resource: "advertisement", action: "read" },
    { name: "Read All Advertisement", slug: "advertisement.read.all", resource: "advertisement", action: "read.all" },
    { name: "Update Advertisement", slug: "advertisement.update", resource: "advertisement", action: "update" },
    { name: "Delete Advertisement", slug: "advertisement.delete", resource: "advertisement", action: "delete" },
    // Analytics permissions
    { name: "Read Analytics", slug: "analytics.read", resource: "analytics", action: "read" },
    // Menu permissions
    { name: "Create Menu", slug: "menu.create", resource: "menu", action: "create" },
    { name: "Read Menu", slug: "menu.read", resource: "menu", action: "read" },
    { name: "Update Menu", slug: "menu.update", resource: "menu", action: "update" },
    { name: "Delete Menu", slug: "menu.delete", resource: "menu", action: "delete" },
  ];

  console.log("📝 Creating permissions...");
  const createdPermissions = [];
  for (const perm of permissions) {
    const existing = await prisma.permission.findUnique({
      where: { slug: perm.slug },
    });
    if (!existing) {
      const created = await prisma.permission.create({
        data: perm,
      });
      createdPermissions.push(created);
      console.log(`  ✓ Created permission: ${perm.slug}`);
    } else {
      createdPermissions.push(existing);
      console.log(`  - Permission already exists: ${perm.slug}`);
    }
  }

  // Create default menus
  console.log("📋 Creating menus...");
  const menus = [
    // Dashboard menus
    { name: "Dashboard", slug: "dashboard", path: "/dashboard", icon: "dashboard", order: 1, isPublic: false },
    { name: "My Blogs", slug: "blogs", path: "/dashboard/blogs", icon: "blogs", order: 2, isPublic: false },
    { name: "Profile", slug: "profile", path: "/dashboard/profile", icon: "profile", order: 3, isPublic: false },
    // News management menus
    { name: "News", slug: "news", path: "/dashboard/news", icon: "news", order: 4, isPublic: false },
    { name: "Media", slug: "media", path: "/dashboard/media", icon: "media", order: 5, isPublic: false },
    { name: "Advertisements", slug: "advertisements", path: "/dashboard/advertisements", icon: "ads", order: 6, isPublic: false },
    { name: "Analytics", slug: "analytics", path: "/dashboard/analytics", icon: "analytics", order: 7, isPublic: false },
    { name: "Menus", slug: "menus", path: "/dashboard/menus", icon: "menu", order: 12, isPublic: false },
    // Admin menus
    { name: "Users", slug: "users", path: "/dashboard/users", icon: "users", order: 8, isPublic: false },
    { name: "Roles", slug: "roles", path: "/dashboard/roles", icon: "roles", order: 9, isPublic: false },
    { name: "Permissions", slug: "permissions", path: "/dashboard/permissions", icon: "permissions", order: 10, isPublic: false },
    { name: "Audit Logs", slug: "logs", path: "/dashboard/logs", icon: "logs", order: 11, isPublic: false },
    // Category menus (public - used as news categories)
    { name: "Crime", slug: "crime", path: "/news/crime", icon: "crime", order: 1, isPublic: true },
    { name: "State", slug: "state", path: "/news/state", icon: "state", order: 2, isPublic: true },
    { name: "National", slug: "national", path: "/news/national", icon: "national", order: 3, isPublic: true },
    { name: "International", slug: "international", path: "/news/international", icon: "international", order: 4, isPublic: true },
    { name: "Sports", slug: "sports", path: "/news/sports", icon: "sports", order: 5, isPublic: true },
    { name: "Entertainment", slug: "entertainment", path: "/news/entertainment", icon: "entertainment", order: 6, isPublic: true },
    { name: "Technology", slug: "technology", path: "/news/technology", icon: "technology", order: 7, isPublic: true },
    { name: "Business", slug: "business", path: "/news/business", icon: "business", order: 8, isPublic: true },
  ];

  const createdMenus = [];
  for (const menu of menus) {
    const existing = await prisma.menu.findUnique({
      where: { slug: menu.slug },
    });
    if (!existing) {
      const created = await prisma.menu.create({
        data: menu,
      });
      createdMenus.push(created);
      console.log(`  ✓ Created menu: ${menu.name}`);
    } else {
      createdMenus.push(existing);
      console.log(`  - Menu already exists: ${menu.name}`);
    }
  }

  // Create superadmin role
  console.log("👑 Creating superadmin role...");
  let superadminRole = await prisma.role.findUnique({
    where: { slug: "superadmin" },
  });

  if (!superadminRole) {
    superadminRole = await prisma.role.create({
      data: {
        name: "Super Admin",
        slug: "superadmin",
        description: "Super administrator with full system access",
        isActive: true,
      },
    });
    console.log("  ✓ Created superadmin role");
  } else {
    console.log("  - Superadmin role already exists");
  }

  // Assign all permissions and menus to superadmin
  await prisma.rolePermission.deleteMany({
    where: { roleId: superadminRole.id },
  });
  await prisma.roleMenu.deleteMany({
    where: { roleId: superadminRole.id },
  });

  await prisma.rolePermission.createMany({
    data: createdPermissions.map((perm) => ({
      roleId: superadminRole!.id,
      permissionId: perm.id,
    })),
    skipDuplicates: true,
  });

  await prisma.roleMenu.createMany({
    data: createdMenus.map((menu) => ({
      roleId: superadminRole!.id,
      menuId: menu.id,
    })),
    skipDuplicates: true,
  });

  console.log("  ✓ Assigned all permissions and menus to superadmin");

  // Create citizen role
  console.log("👤 Creating citizen role...");
  let citizenRole = await prisma.role.findUnique({
    where: { slug: "citizen" },
  });

  if (!citizenRole) {
    citizenRole = await prisma.role.create({
      data: {
        name: "Citizen",
        slug: "citizen",
        description: "Default role for registered users",
        isActive: true,
      },
    });
    console.log("  ✓ Created citizen role");
  } else {
    console.log("  - Citizen role already exists");
  }

  // Assign blog permissions to citizen role
  const blogPermissions = createdPermissions.filter(
    (p) => p.slug.startsWith("blog.")
  );
  
  await prisma.rolePermission.deleteMany({
    where: { roleId: citizenRole.id },
  });
  await prisma.roleMenu.deleteMany({
    where: { roleId: citizenRole.id },
  });

  // Citizen can create and manage their own blogs
  const citizenBlogPerms = blogPermissions.filter(
    (p) => p.slug === "blog.create" || p.slug === "blog.read" || p.slug === "blog.update" || p.slug === "blog.delete"
  );

  await prisma.rolePermission.createMany({
    data: citizenBlogPerms.map((perm) => ({
      roleId: citizenRole!.id,
      permissionId: perm.id,
    })),
    skipDuplicates: true,
  });

  // Assign blogs and profile menus to citizen
  const citizenMenus = createdMenus.filter(
    (m) => m.slug === "blogs" || m.slug === "profile" || m.slug === "dashboard"
  );

  await prisma.roleMenu.createMany({
    data: citizenMenus.map((menu) => ({
      roleId: citizenRole!.id,
      menuId: menu.id,
    })),
    skipDuplicates: true,
  });

  console.log("  ✓ Assigned blog permissions and menus to citizen role");

  // Create Author role
  console.log("✍️ Creating Author role...");
  let authorRole = await prisma.role.findUnique({
    where: { slug: "author" },
  });

  if (!authorRole) {
    authorRole = await prisma.role.create({
      data: {
        name: "Author",
        slug: "author",
        description: "Can create and manage own news posts",
        isActive: true,
      },
    });
    console.log("  ✓ Created Author role");
  } else {
    console.log("  - Author role already exists");
  }

  // Assign news permissions to Author (only own posts)
  const authorNewsPerms = createdPermissions.filter(
    (p) => p.slug === "news.create" || p.slug === "news.read" || p.slug === "news.update" || p.slug === "news.delete"
  );

  await prisma.rolePermission.deleteMany({
    where: { roleId: authorRole.id },
  });
  await prisma.roleMenu.deleteMany({
    where: { roleId: authorRole.id },
  });

  await prisma.rolePermission.createMany({
    data: authorNewsPerms.map((perm) => ({
      roleId: authorRole!.id,
      permissionId: perm.id,
    })),
    skipDuplicates: true,
  });

  // Assign menus to Author
  const authorMenus = createdMenus.filter(
    (m) => m.slug === "dashboard" || m.slug === "news" || m.slug === "media" || m.slug === "profile"
  );

  await prisma.roleMenu.createMany({
    data: authorMenus.map((menu) => ({
      roleId: authorRole!.id,
      menuId: menu.id,
    })),
    skipDuplicates: true,
  });

  console.log("  ✓ Assigned news permissions and menus to Author role");

  // Create Editor role
  console.log("✏️ Creating Editor role...");
  let editorRole = await prisma.role.findUnique({
    where: { slug: "editor" },
  });

  if (!editorRole) {
    editorRole = await prisma.role.create({
      data: {
        name: "Editor",
        slug: "editor",
        description: "Can create, edit, and manage all news posts",
        isActive: true,
      },
    });
    console.log("  ✓ Created Editor role");
  } else {
    console.log("  - Editor role already exists");
  }

  // Assign news permissions to Editor (all posts)
  const editorNewsPerms = createdPermissions.filter(
    (p) => p.slug.startsWith("news.")
  );

  await prisma.rolePermission.deleteMany({
    where: { roleId: editorRole.id },
  });
  await prisma.roleMenu.deleteMany({
    where: { roleId: editorRole.id },
  });

  await prisma.rolePermission.createMany({
    data: editorNewsPerms.map((perm) => ({
      roleId: editorRole!.id,
      permissionId: perm.id,
    })),
    skipDuplicates: true,
  });

  // Assign media permissions to Editor
  const editorMediaPerms = createdPermissions.filter(
    (p) => p.slug.startsWith("media.")
  );

  await prisma.rolePermission.createMany({
    data: editorMediaPerms.map((perm) => ({
      roleId: editorRole!.id,
      permissionId: perm.id,
    })),
    skipDuplicates: true,
  });

  // Assign analytics permission to Editor
  const editorAnalyticsPerm = createdPermissions.find(
    (p) => p.slug === "analytics.read"
  );
  if (editorAnalyticsPerm) {
    await prisma.rolePermission.create({
      data: {
        roleId: editorRole.id,
        permissionId: editorAnalyticsPerm.id,
      },
    });
  }

  // Assign menu permissions to Editor
  const editorMenuPerms = createdPermissions.filter(
    (p) => p.slug.startsWith("menu.")
  );

  await prisma.rolePermission.createMany({
    data: editorMenuPerms.map((perm) => ({
      roleId: editorRole!.id,
      permissionId: perm.id,
    })),
    skipDuplicates: true,
  });

  // Assign menus to Editor
  const editorMenus = createdMenus.filter(
    (m) => m.slug === "dashboard" || m.slug === "news" || m.slug === "media" || 
          m.slug === "analytics" || m.slug === "profile" || m.slug === "menus"
  );

  await prisma.roleMenu.createMany({
    data: editorMenus.map((menu) => ({
      roleId: editorRole!.id,
      menuId: menu.id,
    })),
    skipDuplicates: true,
  });

  console.log("  ✓ Assigned news, media, and analytics permissions to Editor role");

  // Create default admin user
  console.log("👤 Creating default admin user...");
  const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || "admin@example.com";
  const adminUsername = process.env.DEFAULT_ADMIN_USERNAME || "admin";
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || "Admin@123";

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        username: adminUsername,
        password: hashedPassword,
        firstName: "Admin",
        lastName: "User",
        isActive: true,
        isEmailVerified: true,
        provider: "credentials",
      },
    });

    // Assign superadmin role
    await prisma.userRole.create({
      data: {
        userId: adminUser.id,
        roleId: superadminRole.id,
      },
    });

    console.log("  ✓ Created admin user");
    console.log(`  📧 Email: ${adminEmail}`);
    console.log(`  👤 Username: ${adminUsername}`);
    console.log(`  🔑 Password: ${adminPassword}`);
    console.log("  ⚠️  Please change the default password after first login!");
  } else {
    console.log("  - Admin user already exists");
  }

  console.log("✅ Seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

