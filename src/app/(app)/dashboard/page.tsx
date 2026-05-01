import { BroadcastBar } from "@/components/dashboard/broadcast-bar";
import { DailyCheckInCard } from "@/components/dashboard/daily-check-in-card";
import { HomeLocationCard } from "@/components/home-location/home-location-card";
import { LauncherGrid } from "@/components/dashboard/launcher-grid";
import { LiveAlertFeed } from "@/components/dashboard/live-alert-feed";
import { LiveBriefingRail } from "@/components/dashboard/live-briefing-rail";
import { MobilePanelFrame } from "@/components/mobile/mobile-panel-frame";
import { getRequestMessages } from "@/i18n/server";
import { getDashboardPageData } from "@/modules/dashboard/dashboard-data";
import { redirect } from "next/navigation";

type DashboardPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function formatTokenLabel(value: string) {
  return value.replaceAll("_", " ");
}

function getDictionaryLabel(
  value: string | null | undefined,
  labels?: Record<string, string>,
) {
  if (!value) {
    return null;
  }

  return labels?.[value] ?? formatTokenLabel(value);
}

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
  const messages = await getRequestMessages();
  const resolvedSearchParams = (await searchParams) ?? undefined;
  const requestedWorkspaceId = getRequestedWorkspaceId(resolvedSearchParams);
  const result = await getDashboardPageData(requestedWorkspaceId);

  if (result.kind === "auth-required" || result.kind === "setup-required") {
    redirect(result.redirectTo);
    return null;
  }

  const dashboardData = result.data;
  const activeWorkspaceName =
    dashboardData.activeWorkspace?.name ?? messages.dashboardPage.noWorkspaceSelected;
  const activeWorkspaceRole =
    getDictionaryLabel(dashboardData.activeWorkspace?.role, messages.dashboardPage.roles) ??
    messages.dashboardPage.noWorkspaceRole;
  const checkInStatus =
    dashboardData.dailyCheckIn.status === "submitted"
      ? messages.dashboardPage.checkInSubmitted
      : messages.dashboardPage.checkInNeeded;
  const launchProfile = dashboardData.launchProfile;
  const activeWorkspaceId = dashboardData.activeWorkspace?.workspaceId ?? null;
  const cityLabel = launchProfile?.city ?? dashboardData.localAreaLabel;
  const themeLabel =
    getDictionaryLabel(launchProfile?.themePreset, messages.dashboardPage.themePresets) ??
    "midnight";
  const layoutLabel =
    getDictionaryLabel(launchProfile?.layoutPreset, messages.dashboardPage.layoutPresets) ??
    "launcher grid";
  const motionLabel =
    getDictionaryLabel(launchProfile?.motionPreset, messages.dashboardPage.motionPresets) ??
    "cinematic";
  const tickerItems = dashboardData.briefing.topics.map((topic) => topic.label);

  return (
    <main className="bb-page-shell overflow-hidden px-4 py-0 text-white md:h-full md:min-h-0 md:px-5 md:py-0">
      <MobilePanelFrame>
      <section className="mx-auto grid max-w-7xl gap-0 md:h-full md:grid-rows-[auto_auto_minmax(0,1fr)]">
        <BroadcastBar cityLabel={cityLabel} tickerItems={tickerItems} />

        <section className="grid gap-3 xl:grid-cols-[minmax(0,1.08fr)_minmax(18rem,0.92fr)]">
          <article className="bb-panel bb-panel-strong p-6 md:p-8">
            <p className="bb-kicker">{messages.dashboardPage.eyebrow}</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold md:text-5xl">
              {messages.dashboardPage.title}
            </h1>
            <p className="bb-helper-copy mt-3 max-w-2xl text-sm md:text-base">
              {messages.dashboardPage.description}
            </p>

            <div className="mt-5 grid gap-2 md:grid-cols-3">
              <article className="bb-compact-card p-3">
                <p className="bb-mini-copy">{messages.dashboardPage.workspaceLabel}</p>
                <span className="bb-metric-value">{activeWorkspaceName}</span>
              </article>
              <article className="bb-compact-card p-3">
                <p className="bb-mini-copy">{messages.dashboardPage.cityLabel}</p>
                <span className="bb-metric-value">{cityLabel}</span>
              </article>
              <article className="bb-compact-card p-3">
                <p className="bb-mini-copy">{messages.dashboardPage.motionLabel}</p>
                <span className="bb-metric-value capitalize">
                  {motionLabel}
                </span>
              </article>
            </div>

            <div className="mt-4">
              <HomeLocationCard
                kicker={messages.dashboardPage.homeBaseKicker}
                title={messages.dashboardPage.homeBaseTitle}
                description={messages.dashboardPage.homeBaseDescription}
                emptyStateCopy={messages.dashboardPage.homeBaseEmptyState}
                actionHref="/start-smart"
                actionLabel={messages.dashboardPage.homeBaseActionLabel}
              />
            </div>
          </article>

          <aside className="grid gap-3 self-start xl:grid-cols-2">
            <article className="bb-panel bb-panel-muted p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="bb-kicker">{messages.dashboardPage.currentModeEyebrow}</p>
                  <h2 className="mt-2 text-2xl font-semibold capitalize">{activeWorkspaceRole}</h2>
                </div>
                <span className="bb-status-pill bb-pill-stable">{checkInStatus}</span>
              </div>
              <div className="bb-meta-row mt-3">
                <span>{dashboardData.isDemo ? messages.dashboardPage.demoWorkspace : messages.dashboardPage.liveMembership}</span>
              </div>
            </article>

            <article className="bb-panel bb-panel-accent p-5">
              <p className="bb-kicker">{messages.dashboardPage.windowProfileEyebrow}</p>
              <h2 className="mt-2 text-2xl font-semibold capitalize">
                {themeLabel}
              </h2>
              <div className="bb-meta-row mt-3">
                <span>
                  {messages.dashboardPage.layoutLabel}: {layoutLabel}
                </span>
                <span>
                  {messages.dashboardPage.motionValueLabel}: {motionLabel}
                </span>
              </div>
            </article>
          </aside>
        </section>

        <section className="grid min-h-0 gap-3 xl:grid-cols-[minmax(0,1.05fr)_minmax(24rem,0.95fr)]">
          <LauncherGrid tools={dashboardData.launcherTools} />
          <LiveBriefingRail briefing={dashboardData.briefing} />
        </section>

        <section className="grid gap-3 xl:grid-cols-2">
          <DailyCheckInCard
            canSubmit={activeWorkspaceId !== null}
            initialCheckIn={dashboardData.dailyCheckIn}
            workspaceId={activeWorkspaceId}
            workspaceName={dashboardData.activeWorkspace?.name ?? null}
          />
          <LiveAlertFeed workspaceId={activeWorkspaceId} />
        </section>
      </section>
      </MobilePanelFrame>
    </main>
  );
}
