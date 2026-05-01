import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const getDashboardPageData = vi.hoisted(() => vi.fn());
const redirect = vi.hoisted(() => vi.fn());
const refresh = vi.hoisted(() => vi.fn());

vi.mock("@/modules/dashboard/dashboard-data", () => ({
  getDashboardPageData,
}));

vi.mock("next/navigation", () => ({
  redirect,
  useRouter: () => ({
    refresh,
  }),
}));

import DashboardPage from "./page";

describe("DashboardPage", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the fixed money dashboard with record, local, and privacy flows", async () => {
    getDashboardPageData.mockResolvedValue({
      kind: "data",
      data: {
        activeWorkspace: {
          id: "workspace-1",
          workspaceId: "workspace-1",
          name: "Household",
          role: "owner",
        },
        accounting: {
          snapshot: {
            categories: [
              {
                id: "food",
                name: "Food",
                monthlyLimit: 400,
                spent: 330,
                remaining: 70,
                ratio: 0.825,
                status: "at_risk",
              },
            ],
            dueSoonBills: [{ id: "rent", title: "Rent", amount: 1000, dueInDays: 2 }],
            cashflow: {
              availableCash: 1250,
              dueSoonTotal: 1000,
              spentTotal: 330,
              netCashflow: -80,
              status: "negative",
            },
          },
          advice: [
            {
              id: "negative-cashflow",
              title: "Cover essentials before anything flexible.",
              detail: "Your near-term cashflow is below zero. Re-rank bills and discretionary spending today.",
              learnSlug: "cashflow-triage",
              severity: "critical",
            },
          ],
          expenseForm: {
            workspaceId: "workspace-1",
            accountOptions: [{ value: "checking", label: "Checking" }],
            categoryOptions: [{ value: "food", label: "Food" }],
            defaultOccurredAt: "2026-05-01",
          },
          recentExpenses: [
            {
              id: "txn-1",
              merchantName: "Corner Store",
              amount: 18.25,
              occurredAt: "2026-05-01T00:00:00.000Z",
              categoryName: "Food",
            },
          ],
        },
        dailyCheckIn: {
          status: "submitted",
          checkInDate: "2026-05-01",
          headline: "Today is still inside the plan.",
          plannedSpend: 42,
          alertCount: 0,
          alerts: [],
          cashStatus: "positive",
          netCashflow: 310,
          lastSubmittedAt: "2026-05-01T09:00:00.000Z",
        },
        homeLocation: {
          city: "Austin",
          stateCode: "TX",
          countryCode: "US",
          label: "Austin, TX",
          source: "user_selected",
        },
        isDemo: false,
        launcherTools: [],
        launchProfile: null,
        briefing: {
          generatedAt: "2026-05-01T12:00:00.000Z",
          sourceStatus: "live",
          topics: [{ id: "rates", label: "Rates hold steady" }],
        },
        localAreaLabel: "Austin, TX",
        localSignals: {
          officialJobSearchHref:
            "https://www.indeed.com/jobs?q=budget+assistant&l=Austin%2C%20TX",
          jobMatches: [
            {
              slug: "weekend-bookkeeping-assistant",
              title: "Weekend Bookkeeping Assistant",
              company: "Pine & Paper",
              location: "Remote",
              workplace: "remote",
              salaryMin: 24000,
              salaryMax: 32000,
              salaryLabel: "$24k-$32k",
              jobType: "part_time",
              industry: "bookkeeping",
              experienceLevel: "entry",
              schedule: "weekend",
              benefits: ["remote_stipend"],
              visaStatus: "no_sponsorship_needed",
              postingAgeDays: 8,
              fitGoals: ["raise_income_fast"],
              fitSignals: ["second_job_friendly", "flexible_hours", "no_degree_pathway"],
              summary: "Part-time remote work suited for second-income support and bookkeeping exposure.",
              reasons: ["Explicitly matches your requested role: bookkeeping."],
              score: 33,
            },
          ],
          financeHeadlines: [{ id: "rates", title: "Rates hold steady" }],
        },
        matchedRequestedWorkspace: true,
        personalization: {
          profile: {
            genderIdentity: "woman",
            pronouns: "she_her",
            communicationStyle: "direct",
            coachingIntensity: "focused",
            privacyVersion: "v1",
            consented: true,
          },
          jobPreferences: {
            roleInterests: ["bookkeeping"],
            certifications: [],
            licenseTypes: [],
            careWorkInterest: false,
            childCareInterest: false,
            petCareInterest: false,
            nursingInterest: false,
            teachingInterest: false,
            notificationEnabled: true,
          },
        },
        privacyCommitments: [
          "No marketing data is recorded or sold.",
          "Email stays private and is only used for account authority, sign-in, and verification.",
          "Personalization stays user-only and is not shared with brokers or third-party advertisers.",
          "Home location stores city and state only.",
        ],
        requestedWorkspaceId: "workspace-1",
        resolutionSource: "requested",
        userDisplayName: "Avery",
        workspaces: [
          {
            id: "workspace-1",
            workspaceId: "workspace-1",
            name: "Household",
            role: "owner",
            isDefault: true,
          },
        ],
      },
    });

    const view = await DashboardPage({
      searchParams: Promise.resolve({ workspaceId: "workspace-1" }),
    });
    render(view);

    expect(getDashboardPageData).toHaveBeenCalledWith("workspace-1");
    expect(screen.getByRole("heading", { name: /money dashboard/i })).toBeInTheDocument();
    expect(
      screen.getByText(/record expenses, protect the plan, and keep privacy promises visible\./i),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /interactive billboard/i })).not.toBeInTheDocument();
    expect(screen.getByText("Household")).toBeInTheDocument();
    expect(screen.getByText("Austin, TX")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /record/i })).toBeInTheDocument();
    expect(screen.getAllByText(/food/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: /recent activity/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/account/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save expense/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /budget/i }));

    expect(screen.getByRole("heading", { name: /budget snapshot/i })).toBeInTheDocument();
    expect(screen.getByText(/\$70\.00 left/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /local/i }));

    expect(screen.getByRole("heading", { name: /local signals/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /local/i })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /^city$/i })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /^state$/i })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /store only city and state/i })).toBeChecked();
    expect(screen.getByRole("button", { name: /save home area/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /job preference signals/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/requested roles/i)).toHaveValue("bookkeeping");
    expect(screen.getByRole("button", { name: /save job signals/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open official job search/i })).toHaveAttribute(
      "href",
      "https://www.indeed.com/jobs?q=budget+assistant&l=Austin%2C%20TX",
    );
    expect(screen.getByText(/rates hold steady/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /privacy/i }));

    expect(screen.getByRole("heading", { name: /privacy promise/i })).toBeInTheDocument();
    expect(screen.getAllByText(/no marketing data is recorded or sold/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: /personalization/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/gender identity/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/pronouns/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save privacy settings/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open official docs/i })).toHaveAttribute(
      "href",
      "/settings/integrations",
    );
  });

  it("redirects anonymous live access to sign-in", async () => {
    getDashboardPageData.mockResolvedValue({
      kind: "auth-required",
      redirectTo: "/sign-in?redirectTo=%2Fdashboard%3FworkspaceId%3Dworkspace-2",
    });

    await DashboardPage({
      searchParams: Promise.resolve({ workspaceId: "workspace-2" }),
    });

    expect(redirect).toHaveBeenCalledWith(
      "/sign-in?redirectTo=%2Fdashboard%3FworkspaceId%3Dworkspace-2",
    );
  });

  it("redirects signed-in users without local setup to auth continue", async () => {
    getDashboardPageData.mockResolvedValue({
      kind: "setup-required",
      redirectTo: "/auth/continue?redirectTo=%2Fdashboard%3FworkspaceId%3Dworkspace-2",
    });

    await DashboardPage({
      searchParams: Promise.resolve({ workspaceId: "workspace-2" }),
    });

    expect(redirect).toHaveBeenCalledWith(
      "/auth/continue?redirectTo=%2Fdashboard%3FworkspaceId%3Dworkspace-2",
    );
  });
});
