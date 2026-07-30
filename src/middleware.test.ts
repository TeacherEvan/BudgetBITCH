import { describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({
  clerkMiddleware: vi.fn(() => () => "clerk-middleware-response"),
}));

import proxy, { config } from "./proxy";

describe("proxy", () => {
  it("exports clerkMiddleware handler", () => {
    expect(typeof proxy).toBe("function");
  });

  it("configures clerk proxy matcher including __clerk", () => {
    expect(config.matcher).toContain("/__clerk/:path*");
  });
});
