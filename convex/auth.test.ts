import { describe, it, expect } from "vitest";
import { normalizePasswordEmail } from "./auth";

describe("normalizePasswordEmail", () => {
  it("trims and lowercases", () => {
    expect(normalizePasswordEmail("  Evan@Example.COM ")).toBe("evan@example.com");
  });

  it("throws on non-string input", () => {
    expect(() => normalizePasswordEmail(undefined)).toThrow(/email address is required/);
    expect(() => normalizePasswordEmail(42)).toThrow(/email address is required/);
    expect(() => normalizePasswordEmail(null)).toThrow(/email address is required/);
  });

  it("throws on empty/whitespace-only string", () => {
    expect(() => normalizePasswordEmail("   ")).toThrow(/email address is required/);
    expect(() => normalizePasswordEmail("")).toThrow(/email address is required/);
  });
});
