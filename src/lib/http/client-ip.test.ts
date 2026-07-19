import { describe, it, expect } from "vitest";
import type { NextRequest } from "next/server";
import { clientIp } from "./client-ip";

function req(headers: Record<string, string>): NextRequest {
  return {
    headers: { get: (k: string) => headers[k.toLowerCase()] ?? null },
  } as unknown as NextRequest;
}

describe("clientIp", () => {
  it("returns the first hop of x-forwarded-for", () => {
    expect(
      clientIp(req({ "x-forwarded-for": "203.0.113.7, 10.0.0.1, 172.16.0.1" })),
    ).toBe("203.0.113.7");
  });

  it("returns a single x-forwarded-for value", () => {
    expect(clientIp(req({ "x-forwarded-for": "198.51.100.9" }))).toBe(
      "198.51.100.9",
    );
  });

  it("falls back to x-real-ip", () => {
    expect(clientIp(req({ "x-real-ip": "192.0.2.45" }))).toBe("192.0.2.45");
  });

  it("returns undefined when no header is present", () => {
    expect(clientIp(req({}))).toBeUndefined();
  });
});
