import { describe, expect, it } from "vitest";
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
});
