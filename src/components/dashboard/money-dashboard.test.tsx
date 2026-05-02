import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MoneyDashboard } from "./money-dashboard";

const refreshMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: refreshMock,
  }),
}));

function createDashboardData() {
  return {
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
            spent: 100,
            remaining: 300,
            ratio: 0.25,
            status: "safe",
          },
        ],
        dueSoonBills: [],
        cashflow: {
          availableCash: 1250,
          dueSoonTotal: 0,
          spentTotal: 100,
          netCashflow: 1150,
          status: "positive",
        },
      },
      advice: [
        {
          id: "steady-plan",
          title: "Stay steady.",
          detail: "You are inside the plan.",
          learnSlug: "steady-plan",
          severity: "info",
        },
      ],
      expenseForm: {
        workspaceId: "workspace-1",
        accountOptions: [{ value: "checking", label: "Checking" }],
        categoryOptions: [{ value: "food", label: "Food" }],
        defaultOccurredAt: "2026-05-01",
      },
      recentExpenses: [],
    },
    briefing: {
      generatedAt: "2026-05-01T12:00:00.000Z",
      sourceStatus: "live",
      topics: [{ id: "rates", label: "Rates hold steady" }],
    },
    dailyCheckIn: {
      status: "not_started",
      checkInDate: "2026-05-01",
      headline: null,
      plannedSpend: null,
      alertCount: 0,
      alerts: [],
      cashStatus: null,
      netCashflow: null,
      lastSubmittedAt: null,
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
    localAreaLabel: "Austin, TX",
    localSignals: {
      officialJobSearchHref: "https://www.indeed.com/jobs?q=budget+assistant&l=Austin%2C%20TX",
      jobMatches: [],
      financeHeadlines: [{ id: "rates", title: "Rates hold steady" }],
    },
    matchedRequestedWorkspace: true,
    personalization: {
      profile: null,
      jobPreferences: {
        roleInterests: [],
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
  } as const;
}

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("MoneyDashboard", () => {
  it("defaults personalization consent off and only renders the active panel", () => {
    render(<MoneyDashboard data={createDashboardData()} />);

    expect(screen.getByRole("heading", { name: /expense entry/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /privacy promise/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /privacy/i }));

    expect(screen.getByRole("heading", { name: /privacy promise/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /expense entry/i })).not.toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /keep personalization user-only and never for marketing/i })).not.toBeChecked();
  });

  it("refreshes the dashboard after a successful expense save", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ expense: { id: "txn-1" } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<MoneyDashboard data={createDashboardData()} />);

    fireEvent.change(screen.getByLabelText(/merchant/i), {
      target: { value: "Corner Store" },
    });
    fireEvent.change(screen.getByLabelText(/amount/i), {
      target: { value: "18.25" },
    });
    fireEvent.submit(screen.getByRole("button", { name: /save expense/i }).closest("form")!);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/v1/accounting/expenses",
        expect.objectContaining({
          method: "POST",
        }),
      );
      expect(refreshMock).toHaveBeenCalled();
    });
  });

  it("saves job preference signals from the local panel and refreshes the dashboard", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ jobPreference: { id: "job-pref-1" } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<MoneyDashboard data={createDashboardData()} />);

    fireEvent.click(screen.getByRole("tab", { name: /local/i }));
    fireEvent.change(screen.getByLabelText(/requested roles/i), {
      target: { value: "teacher, dog walker" },
    });
    fireEvent.change(screen.getByLabelText(/certifications/i), {
      target: { value: "RN" },
    });
    fireEvent.click(screen.getByRole("checkbox", { name: /teaching/i }));
    fireEvent.submit(screen.getByRole("button", { name: /save job signals/i }).closest("form")!);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/v1/personalization/job-preferences",
        expect.objectContaining({ method: "POST" }),
      );
      expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
        body: JSON.stringify({
          roleInterests: ["teacher", "dog walker"],
          certifications: ["RN"],
          licenseTypes: [],
          careWorkInterest: false,
          childCareInterest: false,
          petCareInterest: false,
          nursingInterest: false,
          teachingInterest: true,
          notificationEnabled: true,
        }),
      });
    });

    expect(
      screen.getByText(/job preference signals saved\. matches will refresh for your stated interests\./i),
    ).toBeInTheDocument();
    expect(refreshMock).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(refreshMock).toHaveBeenCalled();
    });
  });

  it("shows the home-area success message before refreshing the dashboard", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ homeLocation: { id: "home-location-1" } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<MoneyDashboard data={createDashboardData()} />);

    fireEvent.click(screen.getByRole("tab", { name: /local/i }));
    fireEvent.change(screen.getByLabelText(/^city$/i), {
      target: { value: "Oakland" },
    });
    fireEvent.change(screen.getByLabelText(/^state$/i), {
      target: { value: "CA" },
    });
    fireEvent.submit(screen.getByRole("button", { name: /save home area/i }).closest("form")!);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/v1/accounting/home-location",
        expect.objectContaining({ method: "POST" }),
      );
    });

    expect(screen.getByText(/home area saved\. only city and state are kept\./i)).toBeInTheDocument();
    expect(refreshMock).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(refreshMock).toHaveBeenCalled();
    });
  });
});