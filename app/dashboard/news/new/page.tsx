import { getCurrentUser } from "@/lib/auth/jwt";
import { checkPermission } from "@/lib/auth/permissions";
import { redirect } from "next/navigation";
import { CreateNewsForm } from "@/components/news/create-news-form";
import PageContainer from "@/components/layout/page-container";

/**
 * Create News Page
 */
export default async function CreateNewsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const hasCreateAccess = await checkPermission("news.create");
  if (!hasCreateAccess) {
    redirect("/dashboard/news");
  }

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col space-y-2">
        <div>
          <h1 className="text-2xl font-bold">Create News Post</h1>
        
        </div>

        <CreateNewsForm />
      </div>
    </PageContainer>
  );
}

