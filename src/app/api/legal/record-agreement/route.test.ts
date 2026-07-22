import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

// Mock the Convex server client so the test never touches a real deployment.
const mockMutation = vi.fn();
const mockGetClient = vi.fn((opts?: unknown) => {
  void opts;
  return { mutation: (...mArgs: unknown[]) => mockMutation(...mArgs) };
});
vi.mock("@/lib/convex/http-client", () => ({
  getConvexHttpClient: (opts: { auth?: string }) => {
    mockGetClient(opts);
    return { mutation: (...args: unknown[]) => mockMutation(...args) };
  },
}));

// Import after mocks are registered.
const { POST } = await import("./route");

function makeReq(headers: Record<string, string>, body: unknown): NextRequest {
  return {
    headers: {
      get: (k: string) => headers[k.toLowerCase()] ?? null,
    },
    json: async () => body,
  } as unknown as NextRequest;
}

const validBody = {
  termsVersion: "2026-07-19",
  privacyVersion: "2026-07-19",
  userAgent: "vitest-agent",
  token: "client.jwt.token",
};

beforeEach(() => {
  mockMutation.mockReset();
  mockGetClient.mockReset();
});

describe("POST /api/legal/record-agreement", () => {
  it("records with the real client IP from x-forwarded-for (first hop)", async () => {
    mockMutation.mockResolvedValue({ id: "legal-1" });
    const res = await POST(
      makeReq(
        { "x-forwarded-for": "203.0.113.7, 10.0.0.1, 172.16.0.1" },
        validBody,
      ),
    );
    expect(res.status).toBe(200);
    expect(mockMutation).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        ipAddress: "203.0.113.7",
        termsVersion: "2026-07-19",
        privacyVersion: "2026-07-19",
        userAgent: "vitest-agent",
      }),
    );
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", async () => {
    mockMutation.mockResolvedValue({ id: "legal-2" });
    await POST(makeReq({ "x-real-ip": "198.51.100.9" }, validBody));
    expect(mockMutation).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ ipAddress: "198.51.100.9" }),
    );
  });

  it("uses the client-forwarded JWT as the bearer (localStorage auth mode)", async () => {
    mockMutation.mockResolvedValue({ id: "legal-3" });
    await POST(makeReq({ "x-real-ip": "198.51.100.9" }, validBody));
    expect(mockGetClient).toHaveBeenCalledWith(
      expect.objectContaining({ auth: "client.jwt.token" }),
    );
  });

  it("stays anonymous (no auth) for visitors without a token", async () => {
    mockMutation.mockResolvedValue({ id: "legal-4" });
    await POST(
      makeReq({ "x-real-ip": "198.51.100.9" }, { ...validBody, token: "" }),
    );
    expect(mockGetClient).toHaveBeenCalledWith(
      expect.objectContaining({ auth: undefined }),
    );
  });

  it("rejects a malformed body with 400", async () => {
    const res = await POST(makeReq({}, { termsVersion: 123 }));
    expect(res.status).toBe(400);
    expect(mockMutation).not.toHaveBeenCalled();
  });

  it("returns 502 when the Convex mutation throws", async () => {
    mockMutation.mockRejectedValue(new Error("convex down"));
    const res = await POST(makeReq({ "x-real-ip": "198.51.100.9" }, validBody));
    expect(res.status).toBe(502);
  });
});
