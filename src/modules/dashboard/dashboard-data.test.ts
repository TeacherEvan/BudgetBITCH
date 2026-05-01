import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getConvexAuthenticatedIdentityMock = vi.hoisted(() => vi.fn());

const prismaMock = {
  userProfile: {
    findUnique: vi.fn(),
  },
  dailyCheckIn: {
    findUnique: vi.fn(),
  },
};

vi.mock("@/lib/auth/convex-session", () => ({
  getConvexAuthenticatedIdentity: getConvexAuthenticatedIdentityMock,
}));

vi.mock("@/lib/prisma", () => ({
  getPrismaClient: () => prismaMock,
}));

import { getDashboardPageData } from "./dashboard-data";

describe("getDashboardPageData", () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    getConvexAuthenticatedIdentityMock.mockReset();
    prismaMock.userProfile.findUnique.mockReset();
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
});