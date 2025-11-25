import { getCurrentUser } from "@/lib/auth/jwt-server";
import { checkPermission } from "@/lib/auth/permissions";
import { getUserAdvertisements } from "@/lib/actions/advertisements";
import { redirect } from "next/navigation";
import { AdvertisementsTable } from "@/components/advertisements/advertisements-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import PageContainer from "@/components/layout/page-container";

/**
 * Advertisements Management Page
 */
export default async function AdvertisementsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; zone?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const hasCreateAccess = await checkPermission("advertisement.create");
  if (!hasCreateAccess) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const search = params.search;

  const filters: any = {};
  if (params.zone) {
    filters.zone = params.zone;
  }

  const result = await getUserAdvertisements(page, 10, search, filters);

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
            <h1 className="text-3xl font-bold">Advertisements</h1>
            <p className="text-muted-foreground mt-2">
              Manage your advertisements and sponsors
            </p>
          </div>
          <Link href="/dashboard/advertisements/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Advertisement
            </Button>
          </Link>
        </div>

        <AdvertisementsTable
          advertisements={result.advertisements}
          total={result.total}
          page={result.page}
          totalPages={result.totalPages}
          search={search}
        />
      </div>
    </PageContainer>
  );
}

