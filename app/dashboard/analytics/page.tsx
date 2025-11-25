import { getAnalyticsDashboard } from "@/lib/actions/analytics";
import { getCurrentUser } from "@/lib/auth/jwt-server";
import { checkPermission } from "@/lib/auth/permissions";
import { redirect } from "next/navigation";
import { AnalyticsClient } from "@/components/analytics/analytics-client";
import PageContainer from "@/components/layout/page-container";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const hasAccess = await checkPermission("analytics.read");
  if (!hasAccess) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const days = Number(params.days) || 30;

  const result = await getAnalyticsDashboard(days);

  if (!result.success) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <p className="text-destructive">{result.error || "Failed to load analytics"}</p>
        </div>
      </PageContainer>
    );
  }

  return <AnalyticsClient initialData={result} initialDays={days} />;
}

