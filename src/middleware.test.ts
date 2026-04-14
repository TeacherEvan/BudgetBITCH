import { beforeEach, describe, expect, it, vi } from "vitest";

function createPublishableKey(host: string) {
  return `pk_test_${Buffer.from(`${host}$`, "utf8").toString("base64url")}`;
}

const middlewareHandler = vi.hoisted(() => vi.fn(() => "clerk-response"));
const clerkMiddlewareMock = vi.hoisted(() => vi.fn(() => middlewareHandler));
const nextResponseNextMock = vi.hoisted(() => vi.fn(() => "next-response"));

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
    },
  };
});

import middleware, { config } from "../middleware";

describe("middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it("wraps requests in Clerk middleware when Clerk keys are configured", () => {
    const publishableKey = createPublishableKey("clerk.budgetbitch.test");

    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", publishableKey);
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test_budgetbitch");

    const request = new Request("http://localhost/");
    const event = { waitUntil: vi.fn() } as Parameters<typeof middleware>[1];
    const response = middleware(request as never, event);

    expect(clerkMiddlewareMock).toHaveBeenCalledWith({
      publishableKey,
    });
    expect(middlewareHandler).toHaveBeenCalledWith(request, event);
    expect(nextResponseNextMock).not.toHaveBeenCalled();
    expect(response).toBe("clerk-response");
  });

  it("keeps the matcher focused on app routes instead of static assets", () => {
    expect(config.matcher).toEqual(["/((?!_next|.*\\..*).*)", "/"]);
  });
});
