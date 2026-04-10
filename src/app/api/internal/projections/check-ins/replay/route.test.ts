import { afterEach, describe, expect, it, vi } from "vitest";

const replayDailyCheckInProjectionJobs = vi.hoisted(() => vi.fn());

vi.mock("@/modules/projections/replay-check-in-jobs", () => ({
  replayDailyCheckInProjectionJobs,
}));

import { POST } from "./route";

afterEach(() => {
  delete process.env.CONVEX_SYNC_SECRET;
  vi.clearAllMocks();
});

describe("POST /api/internal/projections/check-ins/replay", () => {
  it("returns a clear server error when the shared sync secret is missing", async () => {
    const response = await POST(
      new Request("http://localhost/api/internal/projections/check-ins/replay", {
        method: "POST",
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "CONVEX_SYNC_SECRET is not configured on the server.",
    });
    expect(replayDailyCheckInProjectionJobs).not.toHaveBeenCalled();
  });

  it("rejects requests without the shared sync secret", async () => {
    process.env.CONVEX_SYNC_SECRET = "budgetbitch-sync-secret";

    const response = await POST(
      new Request("http://localhost/api/internal/projections/check-ins/replay", {
        method: "POST",
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Unauthorized.",
    });
  });

  it("replays a bounded batch when the shared sync secret is present", async () => {
    process.env.CONVEX_SYNC_SECRET = "budgetbitch-sync-secret";
    replayDailyCheckInProjectionJobs.mockResolvedValue({
      processed: 1,
      succeeded: 1,
      failed: 0,
    });

    const response = await POST(
      new Request("http://localhost/api/internal/projections/check-ins/replay", {
        method: "POST",
        headers: {
          "x-convex-sync-secret": "budgetbitch-sync-secret",
        },
        body: JSON.stringify({ limit: 10 }),
      }),
    );

    expect(response.status).toBe(200);
    expect(replayDailyCheckInProjectionJobs).toHaveBeenCalledWith({ limit: 10 });
    await expect(response.json()).resolves.toEqual({
      processed: 1,
      succeeded: 1,
      failed: 0,
    });
  });
});
