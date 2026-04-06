import { describe, expect, it } from "vitest";
import { canAccessAppRoute } from "./route-guard";

describe("canAccessAppRoute", () => {
  it("denies anonymous users", () => {
    expect(canAccessAppRoute(null)).toEqual({
      allowed: false,
      reason: "unauthenticated",
    });
  });

  it("allows signed-in users", () => {
    expect(canAccessAppRoute({ userId: "user_123" })).toEqual({
      allowed: true,
    });
  });
});
