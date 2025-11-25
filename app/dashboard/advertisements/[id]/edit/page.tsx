import { getCurrentUser } from "@/lib/auth/jwt-server";
import { checkPermission } from "@/lib/auth/permissions";
import { getAdvertisementById } from "@/lib/actions/advertisements";
import { redirect } from "next/navigation";
import { EditAdvertisementForm } from "@/components/advertisements/edit-advertisement-form";
import PageContainer from "@/components/layout/page-container";
import { notFound } from "next/navigation";

/**
 * Edit Advertisement Page
 */
export default async function EditAdvertisementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const hasUpdateAccess = await checkPermission("advertisement.update");
  if (!hasUpdateAccess) {
    redirect("/dashboard/advertisements");
  }

  const { id } = await params;
  const result = await getAdvertisementById(id);

  if (!result.success || !result.advertisement) {
    notFound();
  }

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col space-y-2">
        <div>
          <h1 className="text-3xl font-bold">Edit Advertisement</h1>
          <p className="text-muted-foreground mt-2">
            Update advertisement information
          </p>
        </div>

        <EditAdvertisementForm advertisement={result.advertisement} />
      </div>
    </PageContainer>
  );
}

