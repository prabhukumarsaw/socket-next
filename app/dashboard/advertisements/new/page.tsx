import { getCurrentUser } from "@/lib/auth/jwt-server";
import { checkPermission } from "@/lib/auth/permissions";
import { redirect } from "next/navigation";
import { CreateAdvertisementForm } from "@/components/advertisements/create-advertisement-form";
import PageContainer from "@/components/layout/page-container";

/**
 * Create Advertisement Page
 */
export default async function CreateAdvertisementPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const hasCreateAccess = await checkPermission("advertisement.create");
  if (!hasCreateAccess) {
    redirect("/dashboard/advertisements");
  }

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col space-y-2">
        <div>
          <h1 className="text-3xl font-bold">Create Advertisement</h1>
          <p className="text-muted-foreground mt-2">
            Create a new advertisement or sponsor
          </p>
        </div>

        <CreateAdvertisementForm />
      </div>
    </PageContainer>
  );
}

