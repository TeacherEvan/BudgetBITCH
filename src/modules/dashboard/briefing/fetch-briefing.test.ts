import { describe, expect, it, vi } from "vitest";
import { loadDashboardBriefing } from "./fetch-briefing";

describe("loadDashboardBriefing", () => {
  it("normalizes live source content into five dashboard topics with three short fields each", async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      const content =
        "<html><head><meta name='description' content='Live source for " +
        url +
        ". This copy is intentionally long so the normalizer has to trim it down for the dashboard.' /></head><body><p>Live source for " +
        url +
        ". This copy is intentionally long so the normalizer has to trim it down for the dashboard.</p></body></html>";

      return new Response(content, {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    });

    const briefing = await loadDashboardBriefing({
      fetchImpl,
      now: new Date("2026-04-10T12:00:00.000Z"),
    });

    expect(fetchImpl).toHaveBeenCalledTimes(15);
    expect(briefing.sourceStatus).toBe("live");
    expect(briefing.generatedAt).toBe("2026-04-10T12:00:00.000Z");
    expect(briefing.topics).toHaveLength(5);

    for (const topic of briefing.topics) {
      expect(topic.fields).toHaveLength(3);
      for (const field of topic.fields) {
        expect(field.summary.length).toBeGreaterThan(0);
        expect(field.summary.length).toBeLessThanOrEqual(140);
        expect(field.sourceName.length).toBeGreaterThan(0);
        expect(field.sourceUrl).toMatch(/^https?:\/\//);
      }
    }
  });

  it("falls back to seeded copy when live fetch fails", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError("network offline");
    });

    const briefing = await loadDashboardBriefing({
      fetchImpl,
      now: new Date("2026-04-10T12:00:00.000Z"),
    });

    expect(fetchImpl).toHaveBeenCalledTimes(15);
    expect(briefing.sourceStatus).toBe("fallback");
    expect(briefing.topics).toHaveLength(5);
    expect(briefing.topics[0].fields).toHaveLength(3);
    expect(briefing.topics[0].fields[0].summary.length).toBeGreaterThan(0);
  });
});
