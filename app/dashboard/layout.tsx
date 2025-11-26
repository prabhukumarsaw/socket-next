export const dynamic = 'force-dynamic';
import KBar from '@/components/kbar';
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/jwt-server";
import { getUserMenus } from "@/lib/auth/permissions";
import AppSidebar from '@/components/layout/app-sidebar';
import Header from '@/components/layout/header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';

export const metadata: Metadata = {
  title: 'Next Shadcn Dashboard Starter',
  description: 'Basic dashboard with Next.js and Shadcn'
};

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {

  // Check authentication
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/sign-in");
  }

  // Sidebar state cookie
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  // User menu permissions
  const menus = await getUserMenus(user.userId);

  return (
    <KBar>

      {/* MAIN FIXED NO-SCROLL WRAPPER */}
      <div className="h-screen w-screen overflow-hidden fixed top-0 left-0 flex">

        <SidebarProvider defaultOpen={defaultOpen}>

          {/* FIXED SIDEBAR */}
          <AppSidebar menus={menus} user={user} />

          {/* FIXED CONTENT WRAPPER */}
          <div className="flex-1 flex flex-col overflow-hidden">

            {/* FIXED HEADER */}
            <Header user={user} />

            {/* FIXED CONTENT (NO SCROLL) */}
            <div className="flex-1 overflow-hidden">
              {children}
            </div>

          </div>
        </SidebarProvider>
      </div>
    </KBar>
  );
}
