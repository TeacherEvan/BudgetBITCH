import { describe, it, expect } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";

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
});
