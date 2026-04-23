import { describe, expect, it } from "vitest";
import { countryOptions } from "./country-options";
import { fetchRegionalData } from "./regional-fetch";
import { getRegionalSeed } from "./regional-seed";
import { normalizeStartSmartProfile } from "./profile-schema";

describe("normalizeStartSmartProfile", () => {
  it("normalizes custom onboarding answers into a canonical profile", () => {
    const result = normalizeStartSmartProfile({
      countryCode: "US",
      stateCode: "CA",
      ageBand: "young_adult",
      housing: "renting",
      dependents: 0,
      pets: 1,
      incomePattern: "variable",
      debtLoad: "high",
      goals: ["emergency_fund", "debt_relief"],
      benefitsSupport: ["none"],
      preferredIntegrations: ["openai"],
    });

    expect(result.regionKey).toBe("us-ca");
    expect(result.householdKind).toBe("solo");
    expect(result.riskSignals).toContain("income_volatility");
    expect(result.riskSignals).toContain("debt_pressure");
  });

  it("keeps supported Asia region codes compatible with normalization", () => {
    const result = normalizeStartSmartProfile({
      countryCode: "sg",
      stateCode: "01",
      ageBand: "adult",
      housing: "renting",
      adults: 1,
      dependents: 0,
      pets: 0,
      incomePattern: "steady",
      debtLoad: "low",
      goals: ["emergency_fund"],
      benefitsSupport: ["none"],
      preferredIntegrations: [],
    });

    expect(result.countryCode).toBe("SG");
    expect(result.stateCode).toBe("01");
    expect(result.regionKey).toBe("sg-01");
  });

  it("keeps every supported country backed by a seeded and sourced region example", async () => {
    for (const option of countryOptions) {
      expect(getRegionalSeed(option.supportedRegionKey)).not.toEqual({});
      await expect(fetchRegionalData(option.supportedRegionKey)).resolves.not.toHaveLength(0);
    }
  });
});
