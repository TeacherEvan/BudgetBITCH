import { describe, expect, it } from "vitest";
import { isAbsoluteHttpUrl, normalizeConvexCloudUrl } from "./url";

describe("isAbsoluteHttpUrl", () => {
  it("accepts absolute http and https URLs", () => {
    expect(isAbsoluteHttpUrl("http://localhost:3000")).toBe(true);
    expect(isAbsoluteHttpUrl("https://steady-ox-280.convex.cloud")).toBe(true);
  });

  it("rejects missing, relative, and non-http URLs", () => {
    expect(isAbsoluteHttpUrl(undefined)).toBe(false);
    expect(isAbsoluteHttpUrl("/dashboard")).toBe(false);
    expect(isAbsoluteHttpUrl("mailto:hello@example.com")).toBe(false);
  });
});

describe("normalizeConvexCloudUrl", () => {
  it("keeps absolute Convex URLs", () => {
    expect(normalizeConvexCloudUrl("https://steady-ox-280.convex.cloud")).toBe(
      "https://steady-ox-280.convex.cloud",
    );
  });

  it("adds https to a Convex cloud host", () => {
    expect(normalizeConvexCloudUrl("steady-ox-280.convex.cloud")).toBe(
      "https://steady-ox-280.convex.cloud",
    );
  });

  it("converts Convex deployment values to cloud URLs", () => {
    expect(normalizeConvexCloudUrl("prod:steady-ox-280")).toBe(
      "https://steady-ox-280.convex.cloud",
    );
    expect(normalizeConvexCloudUrl("steady-ox-280")).toBe(
      "https://steady-ox-280.convex.cloud",
    );
  });

  it("rejects values that cannot be Convex cloud URLs", () => {
    expect(normalizeConvexCloudUrl("not a url")).toBeNull();
    expect(normalizeConvexCloudUrl("steady-ox-280.convex.site")).toBeNull();
  });
});