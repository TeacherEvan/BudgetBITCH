import { beforeEach, describe, expect, it, vi } from "vitest";

const nextResponseNextMock = vi.hoisted(() => vi.fn(() => "next-response"));
const nextResponseRedirectMock = vi.hoisted(() => vi.fn(() => "redirect-response"));

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

import middleware, { config } from "./middleware";

const publicApiRoutes = [
  "/api/v1/start-smart/blueprint",
  "/api/v1/jobs/recommendations",
  "/api/v1/learn/recommendations",
] as const;

const protectedApiRoutes = [
  "/api/v1/auth/bootstrap",
] as const;

describe("middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nextResponseNextMock.mockReset();
    nextResponseNextMock.mockReturnValue("next-response");
    nextResponseRedirectMock.mockReset();
    nextResponseRedirectMock.mockReturnValue("redirect-response");
  });

  it("keeps the root route public without authentication", async () => {
    const response = await middleware(new Request("http://localhost/") as never);

    expect(nextResponseNextMock).toHaveBeenCalledTimes(1);
    expect(response).toBe("next-response");
  });

  it("does NOT redirect protected pages server-side (client RequireAuth handles it)", async () => {
    // In client-only localStorage auth, the middleware can't read the token,
    // so protected PAGES pass through for the client guard to gate.
    const request = new Request("http://localhost/dashboard");
    const response = await middleware(request as never);

    expect(nextResponseRedirectMock).not.toHaveBeenCalled();
    expect(nextResponseNextMock).toHaveBeenCalledTimes(1);
    expect(response).toBe("next-response");
  });

  it("returns a JSON 401 for protected API routes when no session exists", async () => {
    const request = new Request("http://localhost/api/v1/auth/bootstrap");
    const response = await middleware(request as never) as Response;

    expect(nextResponseRedirectMock).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "missing-session",
        message: "Authentication is required.",
      },
    });
  });

  it.each(publicApiRoutes)(
    "keeps %s outside middleware protection when no session exists",
    async (pathname) => {
      const request = new Request(`http://localhost${pathname}`);
      const response = await middleware(request as never);

      expect(nextResponseRedirectMock).not.toHaveBeenCalled();
      expect(nextResponseNextMock).toHaveBeenCalledTimes(1);
      expect(response).toBe("next-response");
    },
  );

  it("allows protected pages through for the non-production e2e signed-in override cookie", async () => {
    const request = new Request("http://localhost/settings/integrations", {
      headers: {
        cookie: "budgetbitch:e2e-auth-state=signed-in",
      },
    });
    const response = await middleware(request as never);

    expect(nextResponseRedirectMock).not.toHaveBeenCalled();
    expect(nextResponseNextMock).toHaveBeenCalledTimes(1);
    expect(response).toBe("next-response");
  });

  it.each(protectedApiRoutes)("protects %s when no session exists", async (pathname) => {
    const request = new Request(`http://localhost${pathname}`);
    const response = await middleware(request as never) as Response;

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "missing-session",
        message: "Authentication is required.",
      },
    });
  });

  it("keeps the matcher focused on app routes instead of static assets", () => {
    expect(config.matcher).toEqual(["/((?!_next|.*\\..*).*)", "/"]);
  });
});
