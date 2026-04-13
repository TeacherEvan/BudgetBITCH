import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, currentUserMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  currentUserMock: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: authMock,
  currentUser: currentUserMock,
}));

import { getRequestAuth } from "./request-auth";

describe("getRequestAuth", () => {
  beforeEach(() => {
    process.env.NODE_ENV = "test";
    delete process.env.E2E_BYPASS_AUTH;
    delete process.env.E2E_BYPASS_AUTH_SOURCE;
    delete process.env.E2E_TEST_CLERK_USER_ID;
    delete process.env.E2E_TEST_EMAIL;
    delete process.env.E2E_TEST_NAME;
    authMock.mockReset();
    currentUserMock.mockReset();
  });

  it("ignores the bypass flag unless the explicit Playwright guard is enabled", async () => {
    process.env.E2E_BYPASS_AUTH = "true";
    authMock.mockResolvedValue({ userId: "user_live_123" });
    currentUserMock.mockResolvedValue({
      id: "user_live_123",
      fullName: "Budget Person",
      username: "budget-person",
      primaryEmailAddress: { emailAddress: "budget@example.com" },
    });

    await expect(getRequestAuth()).resolves.toEqual({
      userId: "user_live_123",
      email: "budget@example.com",
      displayName: "Budget Person",
    });
  });

  it("ignores the bypass flags when the test runtime guard is absent", async () => {
    process.env.NODE_ENV = "development";
    process.env.E2E_BYPASS_AUTH = "true";
    process.env.E2E_BYPASS_AUTH_SOURCE = "playwright";
    process.env.E2E_TEST_CLERK_USER_ID = "clerk_e2e_user";
    process.env.E2E_TEST_EMAIL = "start-smart-e2e@example.com";
    process.env.E2E_TEST_NAME = "Start Smart E2E";
    authMock.mockResolvedValue({ userId: "user_live_123" });
    currentUserMock.mockResolvedValue({
      id: "user_live_123",
      fullName: "Budget Person",
      username: "budget-person",
      primaryEmailAddress: { emailAddress: "budget@example.com" },
    });

    await expect(getRequestAuth()).resolves.toEqual({
      userId: "user_live_123",
      email: "budget@example.com",
      displayName: "Budget Person",
    });
  });

  it("returns the explicit Playwright bypass profile when E2E auth bypass is enabled", async () => {
    process.env.E2E_BYPASS_AUTH = "true";
    process.env.E2E_BYPASS_AUTH_SOURCE = "playwright";
    process.env.E2E_TEST_CLERK_USER_ID = "clerk_e2e_user";
    process.env.E2E_TEST_EMAIL = "start-smart-e2e@example.com";
    process.env.E2E_TEST_NAME = "Start Smart E2E";

    await expect(getRequestAuth()).resolves.toEqual({
      userId: "clerk_e2e_user",
      email: "start-smart-e2e@example.com",
      displayName: "Start Smart E2E",
    });
  });

  it("returns the active Clerk profile when bypass auth is disabled", async () => {
    authMock.mockResolvedValue({ userId: "user_live_123" });
    currentUserMock.mockResolvedValue({
      id: "user_live_123",
      fullName: "Budget Person",
      username: "budget-person",
      primaryEmailAddress: { emailAddress: "budget@example.com" },
    });

    await expect(getRequestAuth()).resolves.toEqual({
      userId: "user_live_123",
      email: "budget@example.com",
      displayName: "Budget Person",
    });
  });

  it("returns a null email when Clerk has a userId but no primary email", async () => {
    authMock.mockResolvedValue({ userId: "user_live_123" });
    currentUserMock.mockResolvedValue({
      id: "user_live_123",
      fullName: "Budget Person",
      username: "budget-person",
      primaryEmailAddress: null,
    });

    await expect(getRequestAuth()).resolves.toEqual({
      userId: "user_live_123",
      email: null,
      displayName: "Budget Person",
    });
  });

  it("returns null auth details when there is no active Clerk user", async () => {
    authMock.mockResolvedValue({ userId: null });

    await expect(getRequestAuth()).resolves.toEqual({
      userId: null,
      email: null,
      displayName: null,
    });
  });
});