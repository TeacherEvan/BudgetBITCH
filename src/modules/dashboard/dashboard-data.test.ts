import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getConvexAuthenticatedIdentityMock = vi.hoisted(() => vi.fn());
const loadDashboardBriefingMock = vi.hoisted(() => vi.fn());
const cookiesMock = vi.hoisted(() => vi.fn());
const reportAuthBootstrapErrorMock = vi.hoisted(() => vi.fn());
const authBootstrapErrorCodes = vi.hoisted(() => ({
  authenticationRequired: "authentication-required",
  missingConvexSyncSecret: "missing-convex-sync-secret",
  convexIdentityFetchFailed: "convex-identity-fetch-failed",
  convexProfileSyncFailed: "convex-profile-sync-failed",
}));

function makeAuthBootstrapError(input: {
  code: string;
  message: string;
  status: number;
}) {
  const error = new Error(input.message) as Error & {
    code: string;
    status: number;
  };

  error.name = "AuthBootstrapError";
  error.code = input.code;
  error.status = input.status;

  return error;
}

const prismaMock = {
  userProfile: {
    findUnique: vi.fn(),
  },
  workspace: {
    findUnique: vi.fn(),
  },
  financialTransaction: {
    findMany: vi.fn(),
  },
  dailyCheckIn: {
    findUnique: vi.fn(),
  },
};

vi.mock("@/lib/auth/convex-session", () => ({
  authBootstrapErrorCodes,
  getConvexAuthenticatedIdentity: getConvexAuthenticatedIdentityMock,
  isAuthBootstrapError: (error: unknown) =>
    Boolean(
      error &&
      typeof error === "object" &&
      "code" in error &&
      "status" in error,
    ),
  reportAuthBootstrapError: reportAuthBootstrapErrorMock,
}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

vi.mock("@/lib/prisma", () => ({
  getPrismaClient: () => prismaMock,
}));

vi.mock("@/modules/dashboard/briefing/fetch-briefing", () => ({
  createSeededDashboardBriefing: vi.fn(),
  loadDashboardBriefing: loadDashboardBriefingMock,
}));

import { getDashboardPageData } from "./dashboard-data";

describe("getDashboardPageData", () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    getConvexAuthenticatedIdentityMock.mockReset();
    reportAuthBootstrapErrorMock.mockReset();
    loadDashboardBriefingMock.mockReset();
    cookiesMock.mockReset();
    cookiesMock.mockResolvedValue({ get: vi.fn().mockReturnValue(undefined) });
    prismaMock.userProfile.findUnique.mockReset();
    prismaMock.workspace.findUnique.mockReset();
    prismaMock.financialTransaction.findMany.mockReset();
    prismaMock.dailyCheckIn.findUnique.mockReset();
    process.env.DATABASE_URL = "postgres://budgetbitch:test@localhost:5432/budgetbitch";
  });

  afterEach(() => {
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  it("returns an auth-required result instead of demo data when the visitor is anonymous", async () => {
    getConvexAuthenticatedIdentityMock.mockResolvedValue(null);

    await expect(getDashboardPageData("workspace-2")).resolves.toEqual({
      kind: "auth-required",
      redirectTo: "/sign-in?redirectTo=%2Fdashboard%3FworkspaceId%3Dworkspace-2",
    });
  });

  it("returns setup-required when Convex identity verification fails", async () => {
    getConvexAuthenticatedIdentityMock.mockRejectedValue(
      makeAuthBootstrapError({
        code: authBootstrapErrorCodes.convexIdentityFetchFailed,
        message: "Convex identity query failed",
        status: 503,
      }),
    );

    await expect(getDashboardPageData("workspace-2")).resolves.toEqual({
      kind: "setup-required",
      redirectTo:
        "/auth/continue?redirectTo=%2Fdashboard%3FworkspaceId%3Dworkspace-2&error=convex-identity-fetch-failed",
    });

    expect(reportAuthBootstrapErrorMock).toHaveBeenCalledWith(
      expect.objectContaining({ code: authBootstrapErrorCodes.convexIdentityFetchFailed }),
      {
        operation: "identity-verification",
        surface: "dashboard-page",
      },
    );
  });

  it("returns demo data for the non-production signed-in e2e override when Convex has no session", async () => {
    getConvexAuthenticatedIdentityMock.mockResolvedValue(null);
    cookiesMock.mockResolvedValue({
      get: vi.fn().mockImplementation((name: string) =>
        name === "budgetbitch:e2e-auth-state" ? { value: "signed-in" } : undefined,
      ),
    });

    const result = await getDashboardPageData("workspace-2");

    expect(result.kind).toBe("data");
    if (result.kind !== "data") {
      throw new Error("Expected dashboard demo data.");
    }
    expect(result.data.isDemo).toBe(true);
    expect(result.data.requestedWorkspaceId).toBe("workspace-2");
    expect(result.data.accounting.expenseForm.workspaceId).toBe("demo_workspace");
  });

  it("prefers live dashboard data over the e2e override when a real Convex session exists", async () => {
    getConvexAuthenticatedIdentityMock.mockResolvedValue({ tokenIdentifier: "convex|user-1" });
    cookiesMock.mockResolvedValue({
      get: vi.fn().mockImplementation((name: string) =>
        name === "budgetbitch:e2e-auth-state" ? { value: "signed-in" } : undefined,
      ),
    });
    loadDashboardBriefingMock.mockResolvedValue({
      generatedAt: "2026-05-01T12:00:00.000Z",
      sourceStatus: "live",
      topics: [],
    });
    prismaMock.userProfile.findUnique.mockResolvedValue({
      id: "profile-1",
      displayName: "Avery",
      memberships: [
        {
          role: "owner",
          workspace: {
            id: "workspace-1",
            name: "Household",
          },
        },
      ],
      workspacePreferences: [{ workspaceId: "workspace-1", isDefault: true }],
      personalizationProfile: null,
      jobPreferences: [],
    });
    prismaMock.workspace.findUnique.mockResolvedValue({
      id: "workspace-1",
      name: "Household",
      accounts: [{ id: "checking", name: "Checking", balance: 1250 }],
      categories: [{ id: "food", name: "Food", monthlyLimit: 400 }],
      bills: [],
      homeLocations: [],
    });
    prismaMock.financialTransaction.findMany.mockResolvedValue([]);
    prismaMock.dailyCheckIn.findUnique.mockResolvedValue(null);

    const result = await getDashboardPageData("workspace-1");

    expect(result.kind).toBe("data");
    if (result.kind !== "data") {
      throw new Error("Expected live dashboard data.");
    }
    expect(result.data.isDemo).toBe(false);
    expect(result.data.activeWorkspace?.workspaceId).toBe("workspace-1");
    expect(prismaMock.userProfile.findUnique).toHaveBeenCalled();
  });

  it("returns a setup-required result instead of demo data when the account has no local profile", async () => {
    getConvexAuthenticatedIdentityMock.mockResolvedValue({ tokenIdentifier: "convex|user-1" });
    prismaMock.userProfile.findUnique.mockResolvedValue(null);

    await expect(getDashboardPageData("workspace-2")).resolves.toEqual({
      kind: "setup-required",
      redirectTo: "/auth/continue?redirectTo=%2Fdashboard%3FworkspaceId%3Dworkspace-2",
    });
  });

  it("still returns demo data when the database is not configured", async () => {
    process.env.DATABASE_URL = "";

    const result = await getDashboardPageData(null);

    expect(result.kind).toBe("data");
    expect(result.data.isDemo).toBe(true);
  });

  it("keeps live no-workspace fallbacks empty instead of seeding demo accounting", async () => {
    getConvexAuthenticatedIdentityMock.mockResolvedValue({ tokenIdentifier: "convex|user-1" });
    loadDashboardBriefingMock.mockResolvedValue({
      generatedAt: "2026-05-01T12:00:00.000Z",
      sourceStatus: "live",
      topics: [],
    });
    prismaMock.userProfile.findUnique.mockResolvedValue({
      id: "profile-1",
      displayName: "Avery",
      memberships: [],
      workspacePreferences: [],
      personalizationProfile: null,
      jobPreferences: [],
    });

    const result = await getDashboardPageData("workspace-missing");

    expect(result.kind).toBe("data");
    if (result.kind !== "data") {
      throw new Error("Expected live dashboard fallback data.");
    }
    expect(result.data.isDemo).toBe(false);
    expect(result.data.activeWorkspace).toBeNull();
    expect(result.data.accounting.expenseForm.workspaceId).toBeNull();
    expect(result.data.accounting.snapshot.categories).toEqual([]);
    expect(result.data.accounting.snapshot.cashflow).toMatchObject({
      availableCash: 0,
      dueSoonTotal: 0,
      spentTotal: 0,
    });
    expect(result.data.accounting.recentExpenses).toEqual([]);
  });

  it("builds the live money dashboard data from workspace accounting and personalization records", async () => {
    getConvexAuthenticatedIdentityMock.mockResolvedValue({ tokenIdentifier: "convex|user-1" });
    loadDashboardBriefingMock.mockResolvedValue({
      generatedAt: "2026-05-01T12:00:00.000Z",
      sourceStatus: "live",
      topics: [{ id: "rates", label: "Rates hold steady" }],
    });
    prismaMock.userProfile.findUnique.mockResolvedValue({
      id: "profile-1",
      displayName: "Avery",
      memberships: [
        {
          role: "owner",
          workspace: {
            id: "workspace-1",
            name: "Household",
          },
        },
      ],
      workspacePreferences: [{ workspaceId: "workspace-1", isDefault: true }],
      personalizationProfile: {
        genderIdentity: "woman",
        pronouns: "she_her",
        communicationStyle: "direct",
        coachingIntensity: "focused",
        privacyVersion: "v1",
        consentedAt: new Date("2026-05-01T08:00:00.000Z"),
      },
      jobPreferences: [
        {
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
      ],
    });
    prismaMock.workspace.findUnique.mockResolvedValue({
      id: "workspace-1",
      name: "Household",
      accounts: [{ id: "checking", name: "Checking", balance: 1250 }],
      categories: [{ id: "food", name: "Food", monthlyLimit: 400 }],
      bills: [{ id: "rent", title: "Rent", amount: 1000, dueDate: new Date("2026-05-03T00:00:00.000Z") }],
      homeLocations: [
        {
          city: "Austin",
          stateCode: "TX",
          countryCode: "US",
          source: "user_selected",
          consentedAt: new Date("2026-05-01T09:00:00.000Z"),
        },
      ],
    });
    prismaMock.financialTransaction.findMany
      .mockResolvedValueOnce([
        {
          id: "txn-1",
          amount: 330,
          occurredAt: new Date("2026-05-01T00:00:00.000Z"),
          merchantName: "Corner Store",
          budgetCategoryId: "food",
          budgetCategory: { name: "Food" },
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "txn-1",
          amount: 330,
          occurredAt: new Date("2026-05-01T00:00:00.000Z"),
          merchantName: "Corner Store",
          budgetCategoryId: "food",
          budgetCategory: { name: "Food" },
        },
      ]);
    prismaMock.dailyCheckIn.findUnique.mockResolvedValue(null);

    const result = await getDashboardPageData("workspace-1");

    expect(result.kind).toBe("data");
    expect(result.data.activeWorkspace?.workspaceId).toBe("workspace-1");
    expect(result.data.accounting.snapshot.categories).toEqual([
      {
        id: "food",
        name: "Food",
        monthlyLimit: 400,
        spent: 330,
        remaining: 70,
        ratio: 0.825,
        status: "at_risk",
      },
    ]);
    expect(result.data.accounting.snapshot.cashflow).toEqual({
      availableCash: 1250,
      dueSoonTotal: 1000,
      spentTotal: 330,
      netCashflow: -80,
      status: "negative",
    });
    expect(result.data.accounting.advice[0]).toMatchObject({
      id: "negative-cashflow",
      severity: "critical",
    });
    expect(result.data.accounting.expenseForm.workspaceId).toBe("workspace-1");
    expect(result.data.accounting.expenseForm.accountOptions).toEqual([
      { value: "checking", label: "Checking" },
    ]);
    expect(result.data.accounting.recentExpenses[0]).toMatchObject({
      id: "txn-1",
      merchantName: "Corner Store",
      amount: 330,
      categoryName: "Food",
    });
    expect(result.data.homeLocation).toMatchObject({
      city: "Austin",
      stateCode: "TX",
      countryCode: "US",
      label: "Austin, TX",
    });
    expect(result.data.personalization.profile).toMatchObject({
      genderIdentity: "woman",
      pronouns: "she_her",
      communicationStyle: "direct",
      coachingIntensity: "focused",
      privacyVersion: "v1",
      consented: true,
    });
    expect(result.data.personalization.jobPreferences.roleInterests).toEqual(["bookkeeping"]);
    expect(result.data.localSignals.jobMatches[0]).toMatchObject({
      slug: "weekend-bookkeeping-assistant",
    });
    expect(result.data.localSignals.officialJobSearchHref).toContain("Austin%2C%20TX");
    expect(result.data.privacyCommitments).toContain("No marketing data is recorded or sold.");
    expect(prismaMock.financialTransaction.findMany).toHaveBeenNthCalledWith(1, {
      where: {
        workspaceId: "workspace-1",
        occurredAt: {
          gte: new Date("2026-05-01T00:00:00.000Z"),
          lt: new Date("2026-06-01T00:00:00.000Z"),
        },
      },
      select: {
        id: true,
        amount: true,
        occurredAt: true,
        merchantName: true,
        budgetCategoryId: true,
        budgetCategory: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { occurredAt: "desc" },
    });
    expect(prismaMock.financialTransaction.findMany).toHaveBeenNthCalledWith(2, {
      where: {
        workspaceId: "workspace-1",
      },
      select: {
        id: true,
        amount: true,
        occurredAt: true,
        merchantName: true,
        budgetCategoryId: true,
        budgetCategory: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { occurredAt: "desc" },
      take: 5,
    });
  });

  it("excludes prior-month transactions from the current budget snapshot while keeping recent activity", async () => {
    getConvexAuthenticatedIdentityMock.mockResolvedValue({ tokenIdentifier: "convex|user-1" });
    loadDashboardBriefingMock.mockResolvedValue({
      generatedAt: "2026-05-01T12:00:00.000Z",
      sourceStatus: "live",
      topics: [],
    });
    prismaMock.userProfile.findUnique.mockResolvedValue({
      id: "profile-1",
      displayName: "Avery",
      memberships: [
        {
          role: "owner",
          workspace: {
            id: "workspace-1",
            name: "Household",
          },
        },
      ],
      workspacePreferences: [{ workspaceId: "workspace-1", isDefault: true }],
      personalizationProfile: null,
      jobPreferences: [],
    });
    prismaMock.workspace.findUnique.mockResolvedValue({
      id: "workspace-1",
      name: "Household",
      accounts: [{ id: "checking", name: "Checking", balance: 1250 }],
      categories: [{ id: "food", name: "Food", monthlyLimit: 400 }],
      bills: [],
      homeLocations: [],
    });
    prismaMock.financialTransaction.findMany
      .mockResolvedValueOnce([
        {
          id: "txn-current",
          amount: 80,
          occurredAt: new Date("2026-05-01T00:00:00.000Z"),
          merchantName: "Corner Store",
          budgetCategoryId: "food",
          budgetCategory: { name: "Food" },
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "txn-current",
          amount: 80,
          occurredAt: new Date("2026-05-01T00:00:00.000Z"),
          merchantName: "Corner Store",
          budgetCategoryId: "food",
          budgetCategory: { name: "Food" },
        },
        {
          id: "txn-previous",
          amount: 250,
          occurredAt: new Date("2026-04-29T00:00:00.000Z"),
          merchantName: "April Grocer",
          budgetCategoryId: "food",
          budgetCategory: { name: "Food" },
        },
      ]);
    prismaMock.dailyCheckIn.findUnique.mockResolvedValue(null);

    const result = await getDashboardPageData("workspace-1");

    expect(result.kind).toBe("data");
    expect(result.data.accounting.snapshot.categories[0]).toMatchObject({
      spent: 80,
      remaining: 320,
    });
    expect(result.data.accounting.recentExpenses).toHaveLength(2);
    expect(result.data.accounting.recentExpenses[1]).toMatchObject({
      id: "txn-previous",
      merchantName: "April Grocer",
      amount: 250,
    });
  });
});