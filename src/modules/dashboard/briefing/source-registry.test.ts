import { describe, expect, it } from "vitest";
import { dashboardBriefingSourceRegistry } from "./source-registry";

describe("dashboardBriefingSourceRegistry", () => {
  it("defines five core elements with three bounded fields each", () => {
    expect(dashboardBriefingSourceRegistry).toHaveLength(5);
    expect(dashboardBriefingSourceRegistry.map((topic) => topic.key)).toEqual([
      "politics",
      "science",
      "agriculture",
      "entertainment",
      "investments",
    ]);

    for (const topic of dashboardBriefingSourceRegistry) {
      expect(topic.label.length).toBeGreaterThan(0);
      expect(topic.label.length).toBeLessThanOrEqual(24);
      expect(topic.fields).toHaveLength(3);
      expect(new Set(topic.fields.map((field) => field.label)).size).toBe(3);

      for (const field of topic.fields) {
        expect(field.label.length).toBeGreaterThan(0);
        expect(field.label.length).toBeLessThanOrEqual(28);
        expect(field.sourceName.length).toBeGreaterThan(0);
        expect(field.sourceName.length).toBeLessThanOrEqual(48);
        expect(field.sourceUrl).toMatch(/^https?:\/\//);
        expect(field.fallbackSummary.length).toBeGreaterThan(0);
        expect(field.fallbackSummary.length).toBeLessThanOrEqual(140);
      }
    }
  });
});
