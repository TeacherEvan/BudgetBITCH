import { MoneyDashboard } from "@/components/dashboard/money-dashboard";
import { getDashboardPageData } from "@/modules/dashboard/dashboard-data";
import { redirect } from "next/navigation";

type DashboardPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getRequestedWorkspaceId(
  searchParams?: Record<string, string | string[] | undefined>,
): string | null {
  const workspaceId = searchParams?.workspaceId;

  if (Array.isArray(workspaceId)) {
    return workspaceId[0] ?? null;
  }

  return workspaceId ?? null;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const resolvedSearchParams = (await searchParams) ?? undefined;
  const requestedWorkspaceId = getRequestedWorkspaceId(resolvedSearchParams);
  const result = await getDashboardPageData(requestedWorkspaceId);

  if (result.kind === "auth-required" || result.kind === "setup-required") {
    redirect(result.redirectTo);
    return null;
  }

  return (
    <main className="bb-page-shell overflow-hidden px-4 py-0 text-white md:h-full md:min-h-0 md:px-5 md:py-0">
      <MoneyDashboard data={result.data} />
    </main>
  );
}
