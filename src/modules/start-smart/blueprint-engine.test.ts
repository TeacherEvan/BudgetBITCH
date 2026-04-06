import { describe, expect, it } from "vitest";
import { generateMoneySurvivalBlueprint } from "./blueprint-engine";

describe("generateMoneySurvivalBlueprint", () => {
  it("builds essentials, risk warnings, actions, and recommendations", () => {
    const result = generateMoneySurvivalBlueprint({
      profile: {
        regionKey: "us-ca",
        householdKind: "solo",
        ageBand: "young_adult",
        housing: "renting",
        dependents: 0,
        pets: 1,
        incomePattern: "variable",
        debtLoad: "high",
        goals: ["emergency_fund", "debt_relief"],
        riskSignals: ["income_volatility", "debt_pressure"],
        preferredIntegrations: ["openai"],
      },
      regional: {
        regionKey: "us-ca",
        housing: { monthly: 2400, confidence: "verified" },
        transport: { monthly: 250, confidence: "estimated" },
        utilities: { monthly: 180, confidence: "estimated" },
      },
    });

    expect(result.priorityStack[0]).toBe("cover_essentials");
    expect(result.riskWarnings).toContain("high_debt_pressure");
    expect(result.next7Days.length).toBeGreaterThan(0);
    expect(result.learnModuleKeys).toContain("budgeting_basics");
  });
});
