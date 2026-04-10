import { afterEach, describe, expect, it, vi } from "vitest";

const replayDailyCheckInProjectionJobs = vi.hoisted(() => vi.fn());

vi.mock("@/modules/projections/replay-check-in-jobs", () => ({
  replayDailyCheckInProjectionJobs,
}));

import { GET } from "./route";

afterEach(() => {
  delete process.env.CRON_SECRET;
  vi.clearAllMocks();
});

describe("GET /api/cron/projections/check-ins/replay", () => {
  it("returns a clear server error when CRON_SECRET is missing", async () => {
    const response = await GET(
      new Request("http://localhost/api/cron/projections/check-ins/replay"),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "CRON_SECRET is not configured on the server.",
    });
    expect(replayDailyCheckInProjectionJobs).not.toHaveBeenCalled();
  });

  it("rejects requests without the Vercel cron bearer token", async () => {
    process.env.CRON_SECRET = "budgetbitch-cron-secret";

    const response = await GET(
      new Request("http://localhost/api/cron/projections/check-ins/replay"),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Unauthorized.",
    });
  });

  it("replays a bounded batch when the Vercel cron bearer token is present", async () => {
    process.env.CRON_SECRET = "budgetbitch-cron-secret";
    replayDailyCheckInProjectionJobs.mockResolvedValue({
      processed: 3,
      succeeded: 3,
      failed: 0,
    });

    const response = await GET(
      new Request("http://localhost/api/cron/projections/check-ins/replay", {
        headers: {
          authorization: "Bearer budgetbitch-cron-secret",
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(replayDailyCheckInProjectionJobs).toHaveBeenCalledWith({ limit: 25 });
    await expect(response.json()).resolves.toEqual({
      processed: 3,
      succeeded: 3,
      failed: 0,
    });
  });
});
