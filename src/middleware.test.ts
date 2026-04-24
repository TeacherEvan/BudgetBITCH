import { beforeEach, describe, expect, it, vi } from "vitest";

function createPublishableKey(host: string) {
  return `pk_test_${Buffer.from(`${host}$`, "utf8").toString("base64url")}`;
}

const middlewareHandler = vi.hoisted(() => vi.fn(() => "clerk-response"));
const clerkMiddlewareMock = vi.hoisted(() => vi.fn(() => middlewareHandler));
const nextResponseNextMock = vi.hoisted(() => vi.fn(() => "next-response"));
const nextResponseRedirectMock = vi.hoisted(() => vi.fn(() => "redirect-response"));

vi.mock("@clerk/nextjs/server", () => ({
  clerkMiddleware: clerkMiddlewareMock,
}));

vi.mock("next/server", async () => {
  const actual = await vi.importActual<typeof import("next/server")>("next/server");

  return {
    ...actual,
    NextResponse: {
      ...actual.NextResponse,
      next: nextResponseNextMock,
      redirect: nextResponseRedirectMock,
    },
  };
});

import middleware, { config } from "../middleware";

describe("middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    middlewareHandler.mockReset();
    middlewareHandler.mockReturnValue("clerk-response");
    clerkMiddlewareMock.mockReset();
    clerkMiddlewareMock.mockImplementation(() => middlewareHandler);
    nextResponseNextMock.mockReset();
    nextResponseNextMock.mockReturnValue("next-response");
    nextResponseRedirectMock.mockReset();
    nextResponseRedirectMock.mockReturnValue("redirect-response");
    vi.unstubAllEnvs();
  });

  it("skips Clerk middleware when Clerk keys are missing", () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "");
    vi.stubEnv("CLERK_SECRET_KEY", "");

    const event = { waitUntil: vi.fn() } as Parameters<typeof middleware>[1];
    const response = middleware(new Request("http://localhost/") as never, event);

    expect(clerkMiddlewareMock).not.toHaveBeenCalled();
    expect(nextResponseNextMock).toHaveBeenCalledTimes(1);
    expect(response).toBe("next-response");
  });

  it("redirects protected routes to sign-in when Clerk is unavailable", () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "");
    vi.stubEnv("CLERK_SECRET_KEY", "");

    const request = new Request("http://localhost/dashboard");
    const event = { waitUntil: vi.fn() } as Parameters<typeof middleware>[1];
    const response = middleware(request as never, event);

    expect(clerkMiddlewareMock).not.toHaveBeenCalled();
    expect(nextResponseRedirectMock).toHaveBeenCalledWith(new URL("/sign-in", request.url));
    expect(response).toBe("redirect-response");
  });

  it("returns a JSON 503 for protected API routes when Clerk is unavailable", async () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "");
    vi.stubEnv("CLERK_SECRET_KEY", "");

    const request = new Request("http://localhost/api/v1/auth/bootstrap");
    const event = { waitUntil: vi.fn() } as Parameters<typeof middleware>[1];
    const response = middleware(request as never, event);

    expect(clerkMiddlewareMock).not.toHaveBeenCalled();
    expect(nextResponseRedirectMock).not.toHaveBeenCalled();
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "Clerk authentication is not configured on the server.",
    });
  });

  it("protects dashboard routes when Clerk is configured", async () => {
    const publishableKey = createPublishableKey("clerk.budgetbitch.test");
    const protectMock = vi.fn();

    clerkMiddlewareMock.mockImplementation((handler, options) => {
      expect(options).toEqual({ publishableKey });

      return (request: Request, event: unknown) =>
        handler(
          {
            protect: protectMock,
          },
          request,
          event,
        );
    });

    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", publishableKey);
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test_budgetbitch");

    const request = new Request("http://localhost/dashboard?workspaceId=workspace-2");
    const event = { waitUntil: vi.fn() } as Parameters<typeof middleware>[1];

    await middleware(request as never, event);

    expect(protectMock).toHaveBeenCalledWith({
      unauthenticatedUrl:
        "http://localhost/sign-in?redirectTo=%2Fdashboard%3FworkspaceId%3Dworkspace-2",
    });
  });

  it("keeps the root route public when Clerk is configured", async () => {
    const publishableKey = createPublishableKey("clerk.budgetbitch.test");
    const protectMock = vi.fn();

    clerkMiddlewareMock.mockImplementation((handler) => {
      return (request: Request, event: unknown) =>
        handler(
          {
            protect: protectMock,
          },
          request,
          event,
        );
    });

    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", publishableKey);
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test_budgetbitch");

    const request = new Request("http://localhost/");
    const event = { waitUntil: vi.fn() } as Parameters<typeof middleware>[1];

    await middleware(request as never, event);

    expect(protectMock).not.toHaveBeenCalled();
  });

  it("protects API routes when Clerk is configured", async () => {
    const publishableKey = createPublishableKey("clerk.budgetbitch.test");
    const protectMock = vi.fn();

    clerkMiddlewareMock.mockImplementation((handler) => {
      return (request: Request, event: unknown) =>
        handler(
          {
            protect: protectMock,
          },
          request,
          event,
        );
    });

    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", publishableKey);
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test_budgetbitch");

    const request = new Request("http://localhost/api/v1/auth/bootstrap");
    const event = { waitUntil: vi.fn() } as Parameters<typeof middleware>[1];

    await middleware(request as never, event);

    expect(protectMock).toHaveBeenCalledTimes(1);
  });

  it("wraps requests in Clerk middleware when Clerk keys are configured", () => {
    const publishableKey = createPublishableKey("clerk.budgetbitch.test");

    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", publishableKey);
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test_budgetbitch");

    const request = new Request("http://localhost/");
    const event = { waitUntil: vi.fn() } as Parameters<typeof middleware>[1];
    const response = middleware(request as never, event);

    expect(clerkMiddlewareMock).toHaveBeenCalledWith(expect.any(Function), {
      publishableKey,
    });
    expect(middlewareHandler).toHaveBeenCalledWith(request, event);
    expect(response).toBe("clerk-response");
  });

  it("keeps the matcher focused on app routes instead of static assets", () => {
    expect(config.matcher).toEqual(["/((?!_next|.*\\..*).*)", "/"]);
  });
});
