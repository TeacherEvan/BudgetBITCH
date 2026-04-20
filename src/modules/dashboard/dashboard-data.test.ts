import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.hoisted(() => vi.fn());
const isClerkConfiguredMock = vi.hoisted(() => vi.fn());
const findUniqueMock = vi.hoisted(() => vi.fn());

vi.mock("@clerk/nextjs/server", () => ({
  auth: authMock,
}));

vi.mock("@/lib/auth/clerk-config", () => ({
  isClerkConfigured: isClerkConfiguredMock,
}));

vi.mock("@/lib/prisma", () => ({
  getPrismaClient: () => ({
    userProfile: {
      findUnique: findUniqueMock,
    },
    dailyCheckIn: {
      findUnique: vi.fn(),
    },
  }),
}));

vi.mock("@/modules/dashboard/briefing/fetch-briefing", async () => {
  const actual = await vi.importActual<typeof import("@/modules/dashboard/briefing/fetch-briefing")>(
    "@/modules/dashboard/briefing/fetch-briefing",
  );

  return {
    ...actual,
    loadDashboardBriefing: vi.fn(),
  };
});

import { getDashboardPageData } from "./dashboard-data";

describe("getDashboardPageData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("DATABASE_URL", "postgresql://budgetbitch.test");
  });

  it("returns demo data when Clerk is not configured", async () => {
    isClerkConfiguredMock.mockReturnValue(false);

    const pageData = await getDashboardPageData("workspace-1");

    expect(pageData.isDemo).toBe(true);
    expect(authMock).not.toHaveBeenCalled();
  });

  it("logs and falls back to demo data when profile lookup fails", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    isClerkConfiguredMock.mockReturnValue(true);
    authMock.mockResolvedValue({ userId: "user_123" });
    findUniqueMock.mockRejectedValue(new Error("database unavailable"));

    const pageData = await getDashboardPageData("workspace-1");

    expect(pageData.isDemo).toBe(true);
    expect(consoleErrorSpy).toHaveBeenCalledWith("[getDashboardPageData] Unexpected error", {
      message: "database unavailable",
      stack: expect.stringContaining("database unavailable"),
    });

    consoleErrorSpy.mockRestore();
  });
});
