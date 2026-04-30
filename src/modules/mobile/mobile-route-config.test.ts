import { describe, expect, it } from "vitest";
import { mobileRouteConfig } from "./mobile-route-config";

describe("mobileRouteConfig", () => {
  it("keeps the Task 1 mobile route order", () => {
    expect(mobileRouteConfig.map((route) => route.href)).toEqual([
      "/dashboard",
      "/start-smart",
      "/calculator",
      "/notes",
      "/learn",
      "/settings/integrations",
      "/jobs",
    ]);
  });

  it("keeps unique href and label key pairs for the mobile contract", () => {
    expect(new Set(mobileRouteConfig.map((route) => route.href)).size).toBe(mobileRouteConfig.length);
    expect(new Set(mobileRouteConfig.map((route) => route.labelKey)).size).toBe(mobileRouteConfig.length);
  });
});