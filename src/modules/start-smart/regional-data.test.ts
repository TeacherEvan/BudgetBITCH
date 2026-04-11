import { describe, expect, it } from "vitest";
import { buildRegionalSnapshot } from "./regional-data";
import { getRegionalSeed } from "./regional-seed";

describe("buildRegionalSnapshot", () => {
  it("prefers verified official data over estimated fallback values", () => {
    const result = buildRegionalSnapshot({
      regionKey: "us-ca",
      locationKey: "us-ca-los-angeles",
      seed: getRegionalSeed("us-ca-los-angeles"),
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
    expect(result.locationKey).toBe("us-ca-los-angeles");
    expect(result.housing.monthly).toBe(2400);
    expect(result.housing.confidence).toBe("verified");
    expect(result.transport.confidence).toBe("estimated");
  });
});
