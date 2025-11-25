// import { getCurrentUser } from "@/lib/auth/jwt";
// import { checkPermission } from "@/lib/auth/permissions";
// import { getNewsById } from "@/lib/actions/news";
// import { redirect } from "next/navigation";
// import { EditNewsForm } from "@/components/news/edit-news-form";
// import PageContainer from "@/components/layout/page-container";
// import { notFound } from "next/navigation";

// /**
//  * Edit News Page
//  */
// export default async function EditNewsPage({
//   params,
// }: {
//   params: Promise<{ id: string }>;
// }) {
//   const user = await getCurrentUser();
//   if (!user) {
//     redirect("/login");
//   }

//   const hasUpdateAccess = await checkPermission("news.update");
//   if (!hasUpdateAccess) {
//     redirect("/dashboard/news");
//   }

//   const { id } = await params;
//   const result = await getNewsById(id);

//   if (!result.success || !result.news) {
//     notFound();
//   }

//   return (
//     <PageContainer>
//       <div className="flex flex-1 flex-col space-y-2">
//         <div>
//           <h1 className="text-3xl font-bold">Edit News Post</h1>
//           <p className="text-muted-foreground mt-2">
//             Update your news post information
//           </p>
//         </div>

//         <EditNewsForm news={result.news} />
//       </div>
//     </PageContainer>
//   );
// }



import { getCurrentUser } from "@/lib/auth/jwt";
import { checkPermission } from "@/lib/auth/permissions";
import { getNewsById } from "@/lib/actions/news";
import { redirect } from "next/navigation";
import { EditNewsForm } from "@/components/news/edit-news-form";
import PageContainer from "@/components/layout/page-container";
import { notFound } from "next/navigation";

/**
 * Edit News Page
 */
export default async function EditNewsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const hasUpdateAccess = await checkPermission("news.update");
  if (!hasUpdateAccess) {
    redirect("/dashboard/news");
  }

  const { id } = await params;
  const result = await getNewsById(id);

  if (!result.success || !result.news) {
    notFound();
  }

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col space-y-2">
        <div>
          <h1 className="text-2xl font-bold">Edit News Post</h1>
        </div>

        <EditNewsForm news={result.news} />
      </div>
    </PageContainer>
  );
}