import { BookOpen, BriefcaseBusiness, Compass, Layers3, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { DailyCheckInCard } from "@/components/dashboard/daily-check-in-card";
import { LiveAlertFeed } from "@/components/dashboard/live-alert-feed";
import { WorkspaceSwitcher } from "@/components/dashboard/workspace-switcher";
import { getDashboardPageData } from "@/modules/dashboard/dashboard-data";

type DashboardPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type NextActionCard = {
  detail: string;
  href: string;
  icon: LucideIcon;
  label: string;
  title: string;
};

const nextActionCards: NextActionCard[] = [
  {
    title: "Start Smart",
    href: "/start-smart",
    label: "Open setup wizard",
    detail: "Lock the next seven days before you spread attention across other routes.",
    icon: Compass,
  },
  {
    title: "Learn",
    href: "/learn",
    label: "Open Learn",
    detail: "Review short lessons after the workspace board tells you what needs work.",
    icon: BookOpen,
  },
  {
    title: "Jobs",
    href: "/jobs",
    label: "Open Jobs",
    detail: "Check income options only after today’s workspace pressure is clear.",
    icon: BriefcaseBusiness,
  },
];

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
  const dashboardData = await getDashboardPageData(requestedWorkspaceId);
  const activeWorkspaceName = dashboardData.activeWorkspace?.name ?? "No workspace selected";
  const activeWorkspaceRole = dashboardData.activeWorkspace?.role.replaceAll("_", " ") ?? "none";
  const checkInStatus =
    dashboardData.dailyCheckIn.status === "submitted" ? "Submitted today" : "Needs today’s check-in";

  return (
    <main className="bb-page-shell text-white">
      <section className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.9fr)]">
        <div className="grid gap-6">
          <article className="bb-panel bb-panel-strong p-8 md:p-10">
            <p className="bb-kicker">Dashboard</p>
            <div className="mt-4 grid gap-6 xl:grid-cols-[minmax(0,1.16fr)_minmax(18rem,0.84fr)] xl:items-end">
              <div>
                <h1 className="text-5xl font-semibold">Workspace dashboard for {activeWorkspaceName}</h1>
                <p className="bb-copy mt-4 max-w-2xl text-base md:text-lg">
                  Submit today&apos;s check-in, keep the board tied to one workspace, and move into the
                  next action with the right context still visible.
                </p>
                <p className="bb-mini-copy mt-4 max-w-2xl">
                  {dashboardData.workspaces.length > 1
                    ? "Multi-workspace view is on. Switch the board before you review a different household, side hustle, or archive."
                    : "Single-workspace view is on. Keep today’s board focused before opening the next route."}
                </p>
                {dashboardData.isDemo ? (
                  <p className="bb-mini-copy mt-4 max-w-2xl">
                    Demo workspace context is showing until a live membership is available.
                  </p>
                ) : null}
              </div>

              <div className="grid gap-3" aria-label="Dashboard status summary">
                <article className="bb-compact-card">
                  <p className="bb-mini-copy">Active workspace</p>
                  <span className="bb-metric-value">{activeWorkspaceName}</span>
                </article>
                <article className="bb-compact-card">
                  <p className="bb-mini-copy">Access level</p>
                  <span className="bb-metric-value capitalize">{activeWorkspaceRole}</span>
                </article>
                <article className="bb-compact-card">
                  <p className="bb-mini-copy">Check-in status</p>
                  <span className="bb-metric-value">{checkInStatus}</span>
                </article>
              </div>
            </div>
          </article>

          <DailyCheckInCard
            canSubmit={!dashboardData.isDemo && Boolean(dashboardData.activeWorkspace)}
            initialCheckIn={dashboardData.dailyCheckIn}
            workspaceId={dashboardData.activeWorkspace?.id ?? null}
            workspaceName={dashboardData.activeWorkspace?.name ?? null}
          />
        </div>

        <aside className="grid gap-4 self-start">
          <WorkspaceSwitcher
            activeWorkspaceId={dashboardData.activeWorkspace?.id ?? null}
            isDemo={dashboardData.isDemo}
            requestedWorkspaceId={dashboardData.requestedWorkspaceId}
            resolutionSource={dashboardData.resolutionSource}
            workspaces={dashboardData.workspaces}
          />

          <LiveAlertFeed workspaceId={dashboardData.activeWorkspace?.id ?? null} />

          <section className="bb-panel bb-panel-accent p-6" aria-labelledby="dashboard-actions-heading">
            <div className="flex items-start gap-3">
              <span className="bb-icon-badge" aria-hidden="true">
                <Layers3 className="h-5 w-5" />
              </span>
              <div>
                <p className="bb-kicker">Next actions</p>
                <h2 id="dashboard-actions-heading" className="mt-3 text-3xl font-semibold">
                  Open the next route with context
                </h2>
                <p className="bb-mini-copy mt-3">
                  Move only after the current workspace board is clear enough to trust.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {nextActionCards.map(({ detail, href, icon: Icon, label, title }) => (
                <article key={title} className="bb-cluster">
                  <div className="flex items-start gap-3">
                    <span className="bb-icon-badge" aria-hidden="true">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <span className="font-semibold text-white">{title}</span>
                      <p className="bb-mini-copy mt-2">{detail}</p>
                    </div>
                  </div>
                  <Link href={href} className="bb-button-secondary">
                    {label}
                  </Link>
                </article>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}
