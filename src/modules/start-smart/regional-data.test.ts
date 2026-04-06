import { describe, expect, it } from "vitest";
import { buildRegionalSnapshot } from "./regional-data";

describe("buildRegionalSnapshot", () => {
  it("prefers verified official data over estimated fallback values", () => {
    const result = buildRegionalSnapshot({
      regionKey: "us-ca",
      seed: {
        housing: { monthly: 2100, confidence: "estimated" },
        transport: { monthly: 250, confidence: "estimated" },
      },
      fetched: [
        {
          sourceLabel: "California housing board",
          sourceUrl: "https://example.gov/housing",
          trustTier: "official",
          values: {
            housing: { monthly: 2400 },
          },
        },
      ],
    });

    expect(result.regionKey).toBe("us-ca");
    expect(result.housing.monthly).toBe(2400);
    expect(result.housing.confidence).toBe("verified");
    expect(result.transport.confidence).toBe("estimated");
  });
});
