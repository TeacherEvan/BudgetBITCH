import { describe, expect, it } from "vitest";

import { getSafePostAuthRedirect } from "./post-auth-redirect";

describe("getSafePostAuthRedirect", () => {
  it("falls back to /auth/continue for missing or unsafe targets", () => {
    expect(getSafePostAuthRedirect(null)).toBe("/auth/continue");
    expect(getSafePostAuthRedirect(undefined)).toBe("/auth/continue");
    expect(getSafePostAuthRedirect("")).toBe("/auth/continue");
    expect(getSafePostAuthRedirect("   ")).toBe("/auth/continue");
    expect(getSafePostAuthRedirect("https://evil.example/steal")).toBe("/auth/continue");
    expect(getSafePostAuthRedirect("//evil.example/steal")).toBe("/auth/continue");
    expect(getSafePostAuthRedirect("javascript:alert(1)")).toBe("/auth/continue");
    expect(getSafePostAuthRedirect("/settings?from=welcome")).toBe("/auth/continue");
  });

  it("preserves approved in-app targets and strips unsafe params", () => {
    expect(getSafePostAuthRedirect("/")).toBe("/");
    expect(getSafePostAuthRedirect("/auth/continue")).toBe("/auth/continue");
    expect(getSafePostAuthRedirect("/dashboard?from=welcome")).toBe(
      "/dashboard?from=welcome",
    );
    expect(getSafePostAuthRedirect("/dashboard?workspaceId=ws_123&from=welcome")).toBe(
      "/dashboard?workspaceId=ws_123&from=welcome",
    );
    expect(getSafePostAuthRedirect("/dashboard?redirectTo=https://evil.example/steal")).toBe(
      "/dashboard",
    );
    expect(getSafePostAuthRedirect("/auth/continue?redirectTo=https://evil.example/steal")).toBe(
      "/auth/continue",
    );
    expect(getSafePostAuthRedirect("/dashboard#from-welcome")).toBe("/dashboard");
  });
});