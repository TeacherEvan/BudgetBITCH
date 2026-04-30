import { beforeEach, describe, expect, it, vi } from "vitest";

const authSessionMock = vi.hoisted(() => ({
  value: null as { user?: { id?: string | null } } | null,
}));
const authWrapperMock = vi.hoisted(() =>
  vi.fn((handler: (request: Request & { nextUrl: URL; auth: typeof authSessionMock.value }) => unknown) => {
    return (request: Request) => {
      const requestWithAuth = Object.assign(request, {
        nextUrl: new URL(request.url),
        auth: authSessionMock.value,
      });

      return handler(requestWithAuth);
    };
  }),
);
const nextResponseNextMock = vi.hoisted(() => vi.fn(() => "next-response"));
const nextResponseRedirectMock = vi.hoisted(() => vi.fn(() => "redirect-response"));

vi.mock("@/auth", () => ({
  auth: authWrapperMock,
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

import middleware, { config } from "./middleware";

const publicApiRoutes = [
  "/api/v1/start-smart/blueprint",
  "/api/v1/jobs/recommendations",
  "/api/v1/learn/recommendations",
] as const;

const protectedApiRoutes = [
  "/api/v1/auth/bootstrap",
  "/api/v1/check-ins",
  "/api/v1/integrations",
  "/api/v1/integrations/plaid/callback",
] as const;

describe("middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authSessionMock.value = null;
    authWrapperMock.mockClear();
    nextResponseNextMock.mockReset();
    nextResponseNextMock.mockReturnValue("next-response");
    nextResponseRedirectMock.mockReset();
    nextResponseRedirectMock.mockReturnValue("redirect-response");
  });

  it("keeps the root route public without authentication", () => {
    const response = middleware(new Request("http://localhost/") as never, undefined as never);

    expect(nextResponseNextMock).toHaveBeenCalledTimes(1);
    expect(response).toBe("next-response");
  });

  it("redirects protected routes to sign-in when no session exists", () => {
    const request = new Request("http://localhost/dashboard");
    const response = middleware(request as never, undefined as never);

    expect(nextResponseRedirectMock).toHaveBeenCalledWith(
      new URL("/sign-in?redirectTo=%2Fdashboard", request.url),
    );
    expect(response).toBe("redirect-response");
  });

  it("returns a JSON 401 for protected API routes when no session exists", async () => {
    const request = new Request("http://localhost/api/v1/auth/bootstrap");
    const response = middleware(request as never, undefined as never) as Response;

    expect(nextResponseRedirectMock).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Authentication is required.",
    });
  });

  it.each(publicApiRoutes)(
    "keeps %s outside middleware protection when no session exists",
    (pathname) => {
    const request = new Request(`http://localhost${pathname}`);
    const response = middleware(request as never, undefined as never);

    expect(nextResponseRedirectMock).not.toHaveBeenCalled();
    expect(nextResponseNextMock).toHaveBeenCalledTimes(1);
    expect(response).toBe("next-response");
    },
  );

  it("allows protected routes when a session exists", () => {
    authSessionMock.value = {
      user: {
        id: "google-sub-1",
      },
    };

    const request = new Request("http://localhost/dashboard?workspaceId=workspace-2");
    const response = middleware(request as never, undefined as never);

    expect(nextResponseRedirectMock).not.toHaveBeenCalled();
    expect(nextResponseNextMock).toHaveBeenCalledTimes(1);
    expect(response).toBe("next-response");
  });

  it.each(protectedApiRoutes)("protects %s when no session exists", async (pathname) => {
    const request = new Request(`http://localhost${pathname}`);
    const response = middleware(request as never, undefined as never) as Response;

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Authentication is required.",
    });
  });

  it("keeps the matcher focused on app routes instead of static assets", () => {
    expect(config.matcher).toEqual(["/((?!_next|.*\\..*).*)", "/"]);
  });
});
