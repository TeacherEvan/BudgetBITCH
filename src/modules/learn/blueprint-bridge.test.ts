import { describe, expect, it } from "vitest";
import { extractLearnSignalsFromBlueprint } from "./blueprint-bridge";

describe("extractLearnSignalsFromBlueprint", () => {
  it("extracts stable recommendation inputs from a stored blueprint snapshot", () => {
    const result = extractLearnSignalsFromBlueprint({
      priorityStack: ["cover_essentials", "build_emergency_buffer"],
      riskWarnings: ["income_volatility_risk"],
      learnModuleKeys: ["budgeting_basics", "income_variability"],
    });

    expect(result.learnModuleKeys).toEqual([
      "budgeting_basics",
      "income_variability",
    ]);
    expect(result.priorityStack).toContain("cover_essentials");
  });
});
