import { BroadcastBar } from "@/components/dashboard/broadcast-bar";
import { LauncherGrid } from "@/components/dashboard/launcher-grid";
import { LiveBriefingRail } from "@/components/dashboard/live-briefing-rail";
import { getDashboardPageData } from "@/modules/dashboard/dashboard-data";

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
  const dashboardData = await getDashboardPageData(requestedWorkspaceId);
  const activeWorkspaceName = dashboardData.activeWorkspace?.name ?? "No workspace selected";
  const activeWorkspaceRole = dashboardData.activeWorkspace?.role.replaceAll("_", " ") ?? "none";
  const checkInStatus =
    dashboardData.dailyCheckIn.status === "submitted" ? "Submitted today" : "Needs today’s check-in";
  const launchProfile = dashboardData.launchProfile;
  const cityLabel = launchProfile?.city ?? dashboardData.localAreaLabel;
  const tickerItems =
    dashboardData.briefing.topics.length > 0
      ? dashboardData.briefing.topics.map((topic) => topic.label)
      : ["Budget updates", "Launcher grid", "Live briefing"];

  return (
    <main className="bb-page-shell overflow-hidden px-4 py-0 text-white md:px-5 md:py-0">
      <section className="mx-auto grid max-w-7xl gap-0">
        <BroadcastBar cityLabel={cityLabel} tickerItems={tickerItems} />

        <section className="grid gap-3 xl:grid-cols-[minmax(0,1.08fr)_minmax(18rem,0.92fr)]">
          <article className="bb-panel bb-panel-strong p-6 md:p-8">
            <p className="bb-kicker">Dashboard</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold md:text-5xl">
              Interactive billboard
            </h1>
            <p className="bb-copy mt-3 max-w-2xl text-sm md:text-base">
              Keep the city label, the tool deck, and the live briefing in one visible window.
            </p>

            <div className="mt-5 grid gap-2 md:grid-cols-3">
              <article className="bb-compact-card p-3">
                <p className="bb-mini-copy">Workspace</p>
                <span className="bb-metric-value">{activeWorkspaceName}</span>
              </article>
              <article className="bb-compact-card p-3">
                <p className="bb-mini-copy">City</p>
                <span className="bb-metric-value">{cityLabel}</span>
              </article>
              <article className="bb-compact-card p-3">
                <p className="bb-mini-copy">Motion</p>
                <span className="bb-metric-value capitalize">
                  {launchProfile?.motionPreset ?? "cinematic"}
                </span>
              </article>
            </div>
          </article>

          <aside className="grid gap-3 self-start xl:grid-cols-2">
            <article className="bb-panel bb-panel-muted p-5">
              <p className="bb-kicker">Current mode</p>
              <h2 className="mt-2 text-2xl font-semibold capitalize">{activeWorkspaceRole}</h2>
              <p className="bb-mini-copy mt-2 text-sm">
                Check-in status: {checkInStatus}. {dashboardData.isDemo ? "Demo workspace context is showing until a live membership is available." : "Live membership is synced."}
              </p>
            </article>

            <article className="bb-panel bb-panel-accent p-5">
              <p className="bb-kicker">Window profile</p>
              <h2 className="mt-2 text-2xl font-semibold">
                {launchProfile?.themePreset ?? "midnight"}
              </h2>
              <p className="bb-mini-copy mt-2 text-sm">
                Layout {launchProfile?.layoutPreset ?? "launcher_grid"} · Motion{" "}
                {launchProfile?.motionPreset ?? "cinematic"}
              </p>
            </article>
          </aside>
        </section>

        <section className="grid gap-3 xl:grid-cols-[minmax(0,1.05fr)_minmax(24rem,0.95fr)]">
          <LauncherGrid tools={dashboardData.launcherTools} />
          <LiveBriefingRail briefing={dashboardData.briefing} />
        </section>
      </section>
    </main>
  );
}
