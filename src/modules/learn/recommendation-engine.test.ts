import { describe, expect, it } from "vitest";
import { resolveLearnRecommendations } from "./recommendation-engine";

describe("resolveLearnRecommendations", () => {
  it("maps blueprint lesson keys into rich lesson cards", () => {
    const result = resolveLearnRecommendations({
      learnModuleKeys: ["budgeting_basics", "debt_triage"],
      priorityStack: ["cover_essentials", "reduce_debt_damage"],
      riskWarnings: ["high_debt_pressure"],
    });

    expect(result.primary[0]?.key).toBe("budgeting_basics");
    expect(result.primary[1]?.key).toBe("debt_triage");
    expect(result.explainers).toContain(
      "These lessons are recommended because your blueprint prioritizes essentials and debt damage control.",
    );
  });

  it("falls back to evergreen starter lessons when blueprint keys are empty", () => {
    const result = resolveLearnRecommendations({
      learnModuleKeys: [],
      priorityStack: ["cover_essentials"],
      riskWarnings: [],
    });

    expect(result.primary[0]?.key).toBe("budgeting_basics");
  });
});
