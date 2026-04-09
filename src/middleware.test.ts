import { describe, expect, it, vi } from "vitest";

const middlewareHandler = vi.hoisted(() => vi.fn());
const clerkMiddlewareMock = vi.hoisted(() => vi.fn(() => middlewareHandler));

vi.mock("@clerk/nextjs/server", () => ({
  clerkMiddleware: clerkMiddlewareMock,
}));

import middleware, { config } from "../middleware";

describe("middleware", () => {
  it("wraps the app in Clerk middleware", () => {
    expect(clerkMiddlewareMock).toHaveBeenCalledTimes(1);
    expect(middleware).toBe(middlewareHandler);
  });

  it("keeps the matcher focused on app routes instead of static assets", () => {
    expect(config.matcher).toEqual(["/((?!_next|.*\\..*).*)", "/"]);
  });
});
