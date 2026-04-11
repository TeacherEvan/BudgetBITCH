import { describe, expect, it } from "vitest";
import { normalizeStartSmartProfile } from "./profile-schema";

describe("normalizeStartSmartProfile", () => {
  it("normalizes custom onboarding answers into a canonical profile", () => {
    const result = normalizeStartSmartProfile({
      countryCode: "US",
      stateCode: "CA",
      cityCode: "los-angeles",
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

    expect(result.countryCode).toBe("US");
    expect(result.stateCode).toBe("CA");
    expect(result.cityCode).toBe("los-angeles");
    expect(result.regionKey).toBe("us-ca");
    expect(result.locationKey).toBe("us-ca-los-angeles");
    expect(result.householdKind).toBe("solo");
    expect(result.riskSignals).toContain("income_volatility");
    expect(result.riskSignals).toContain("debt_pressure");
  });
});
