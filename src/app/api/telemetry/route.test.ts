import { describe, it, expect, vi, afterEach } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";

afterEach(() => vi.restoreAllMocks());

function makeLog(sessionId = "test-session", extra: Record<string, unknown> = {}) {
  return {
    ts: new Date().toISOString(),
    level: "info" as const,
    event: "test_event",
    service: "budget-boss-web",
    sessionId,
    ...extra,
  };
}

function telemetryRequest(payload: unknown) {
  const body = typeof payload === "string" ? payload : JSON.stringify(payload);
  return new NextRequest("http://localhost:3000/api/telemetry", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}

describe("POST /api/telemetry", () => {
  it("accepts LogEvent with primitive extra fields and returns 204", async () => {
    const payload = {
      logs: [
        {
          ts: new Date().toISOString(),
          level: "info",
          event: "sync_succeeded",
          service: "budget-boss-web",
          sessionId: "test-session",
          durationMs: 42,
          errorName: "NoError",
          isTest: true,
        },
      ],
      metrics: [
        {
          ts: new Date().toISOString(),
          service: "budget-boss-web",
          sessionId: "test-session",
          metric: "sync_duration_ms",
          value: 42,
          unit: "ms",
        },
      ],
    };

    const req = new NextRequest("http://localhost:3000/api/telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    expect(res.status).toBe(204);
  });

  it("returns 400 on invalid JSON", async () => {
    const req = new NextRequest("http://localhost:3000/api/telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "invalid-json",
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  // Regression guard for P2-C3: an unauthenticated caller could previously
  // POST an unbounded payload that was re-emitted verbatim to server logs.
  it("rejects request bodies larger than 32 KB with 413", async () => {
    const sessionId = `oversize-${Date.now()}`;
    const payload = { logs: [makeLog(sessionId, { blob: "x".repeat(40 * 1024) })] };
    const res = await POST(telemetryRequest(payload));
    expect(res.status).toBe(413);
  });

  it("rejects over-long string fields with 400 before they reach the log sink", async () => {
    const sessionId = `longfield-${Date.now()}`;
    const payload = { logs: [makeLog(sessionId, { event: "x".repeat(256) })] };
    const res = await POST(telemetryRequest(payload));
    expect(res.status).toBe(400);
  });

  it("rate-limits a session that floods the endpoint with 429", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const sessionId = `flood-${Date.now()}`;
    const payload = { logs: [makeLog(sessionId)] };

    for (let i = 0; i < 120; i++) {
      expect((await POST(telemetryRequest(payload))).status).toBe(204);
    }
    expect((await POST(telemetryRequest(payload))).status).toBe(429);
  });
});
