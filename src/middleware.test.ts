import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { protectMock, clerkMiddlewareMock } = vi.hoisted(() => ({
  protectMock: vi.fn(),
  clerkMiddlewareMock: vi.fn((handler: unknown) => handler),
}));

vi.mock("@clerk/nextjs/server", () => ({
  clerkMiddleware: clerkMiddlewareMock,
  createRouteMatcher: (patterns: string[]) => (request: NextRequest) => {
    const pathname = request.nextUrl.pathname;

    return patterns.some((pattern) => {
      const basePath = pattern.replace("(.*)", "");
      return pathname === basePath || pathname.startsWith(basePath + "/");
    });
  },
}));

vi.mock("next/server", async () => {
  const actual = await vi.importActual<typeof import("next/server")>("next/server");

  return {
    ...actual,
    NextResponse: {
      ...actual.NextResponse,
      next: vi.fn(() => "next-response"),
    },
  };
});

import middleware, { config } from "../middleware";

describe("middleware", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.E2E_BYPASS_AUTH;
    delete process.env.E2E_BYPASS_AUTH_SOURCE;
    protectMock.mockReset();
  });

  it("protects matched app routes when auth bypass is disabled", async () => {
    const nextSpy = vi.spyOn(NextResponse, "next");

    const response = await middleware(
      { protect: protectMock } as never,
      new NextRequest("http://localhost/start-smart"),
    );

    expect(protectMock).toHaveBeenCalledTimes(1);
    expect(nextSpy).toHaveBeenCalledTimes(1);
    expect(response).toBe(nextSpy.mock.results[0]?.value);
  });

  it("protects workspace-backed api routes when auth bypass is disabled", async () => {
    await middleware(
      { protect: protectMock } as never,
      new NextRequest("http://localhost/api/v1/start-smart/blueprint"),
    );

    expect(protectMock).toHaveBeenCalledTimes(1);
  });

  it("keeps protection enabled when the bypass source guard is missing", async () => {
    process.env.E2E_BYPASS_AUTH = "true";

    await middleware(
      { protect: protectMock } as never,
      new NextRequest("http://localhost/start-smart"),
    );

    expect(protectMock).toHaveBeenCalledTimes(1);
  });

  it("skips Clerk protection when explicit E2E auth bypass is enabled", async () => {
    process.env.E2E_BYPASS_AUTH = "true";
    process.env.E2E_BYPASS_AUTH_SOURCE = "playwright";
    const nextSpy = vi.spyOn(NextResponse, "next");

    const response = await middleware(
      { protect: protectMock } as never,
      new NextRequest("http://localhost/start-smart"),
    );

    expect(nextSpy).toHaveBeenCalled();
    expect(protectMock).not.toHaveBeenCalled();
    expect(response).toBe("next-response");
  });

  it("keeps the matcher focused on app routes instead of static assets", () => {
    expect(config.matcher).toEqual(["/((?!_next|.*\\..*).*)", "/"]);
  });
});