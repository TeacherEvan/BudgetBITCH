import { afterEach, describe, expect, it, vi } from "vitest";

const loadDashboardBriefing = vi.hoisted(() => vi.fn());

vi.mock("@/modules/dashboard/briefing/fetch-briefing", () => ({
  loadDashboardBriefing,
}));

import { GET } from "./route";

afterEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/v1/dashboard/briefing", () => {
  it("returns the briefing payload with cache headers", async () => {
    loadDashboardBriefing.mockResolvedValue({
      generatedAt: "2026-04-10T12:00:00.000Z",
      sourceStatus: "live",
      topics: [
        {
          key: "politics",
          label: "Politics",
          fields: [
            {
              label: "Policies",
              summary: "Policy moves stay active.",
              sourceName: "Reuters",
              sourceUrl: "https://www.reuters.com",
            },
          ],
        },
      ],
    });

    const response = await GET(
      new Request("http://localhost/api/v1/dashboard/briefing?refresh=1"),
    );

    expect(loadDashboardBriefing).toHaveBeenCalledWith({ forceRefresh: true });
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("max-age=300");
    await expect(response.json()).resolves.toMatchObject({
      sourceStatus: "live",
      topics: expect.any(Array),
    });
  });

  it("defaults to cached reads when refresh is absent", async () => {
    loadDashboardBriefing.mockResolvedValue({
      generatedAt: "2026-04-10T12:00:00.000Z",
      sourceStatus: "fallback",
      topics: [],
    });

    const response = await GET(
      new Request("http://localhost/api/v1/dashboard/briefing"),
    );

    expect(loadDashboardBriefing).toHaveBeenCalledWith({ forceRefresh: false });
    expect(response.status).toBe(200);
  });
});
