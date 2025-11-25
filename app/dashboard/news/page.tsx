import { getCurrentUser } from "@/lib/auth/jwt";
import { checkPermission } from "@/lib/auth/permissions";
import { getUserNews } from "@/lib/actions/news";
import { redirect } from "next/navigation";
import { NewsTable } from "@/components/news/news-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import PageContainer from "@/components/layout/page-container";

/**
 * News Management Page
 * Shows user's own news posts (or all posts if has news.read.all permission)
 */
export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  // Check if user has news.create permission
  const hasCreateAccess = await checkPermission("news.create");
  if (!hasCreateAccess) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const search = params.search;

  const result = await getUserNews(page, 10, search);

  if (!result.success) {
    return (
      <div className="p-6">
        <p className="text-destructive">{result.error}</p>
      </div>
    );
  }

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">News Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage your news posts for Bawal News
            </p>
          </div>
          <Link href="/dashboard/news/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create News
            </Button>
          </Link>
        </div>

        <NewsTable
          news={result.news}
          total={result.total}
          page={result.page}
          totalPages={result.totalPages}
          search={search}
        />
      </div>
    </PageContainer>
  );
}

