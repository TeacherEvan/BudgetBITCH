import { describe, expect, it } from "vitest";
import { extractJobSignalsFromBlueprint } from "./blueprint-bridge";

describe("extractJobSignalsFromBlueprint", () => {
  it("extracts stable jobs signals from a blueprint snapshot", () => {
    const result = extractJobSignalsFromBlueprint({
      priorityStack: ["cover_essentials", "stabilize_cash_flow"],
      riskWarnings: ["income_volatility_risk"],
      learnModuleKeys: ["income_variability"],
    });

    expect(result.priorityStack).toContain("stabilize_cash_flow");
    expect(result.riskWarnings).toContain("income_volatility_risk");
  });
});
