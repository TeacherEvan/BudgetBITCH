import { describe, expect, it } from "vitest";
import { learnLessonSchema } from "./module-schema";

describe("learnLessonSchema", () => {
  it("accepts a complete story-driven lesson module", () => {
    const result = learnLessonSchema.parse({
      slug: "budgeting-basics",
      key: "budgeting_basics",
      title: "Budgeting Basics",
      category: "budgeting",
      tone: "chaotic_comedy",
      summary: "A funny first lesson about giving every dollar a job.",
      whyItMatters:
        "Users need a starter frame for essential vs optional spending.",
      blueprintSignals: ["cover_essentials", "build_emergency_buffer"],
      scenes: [
        {
          id: "scene-1",
          absurdScenario:
            "A raccoon opens six streaming subscriptions with your debit card.",
          plainEnglish:
            "A budget is a spending plan before the spending happens.",
          applyNow:
            "List fixed bills, then assign the remaining dollars on purpose.",
        },
      ],
      takeaways: [
        "A budget is a plan, not a punishment.",
        "Essentials get funded before optional chaos.",
      ],
      nextActionLabel: "Review your essentials",
    });

    expect(result.slug).toBe("budgeting-basics");
    expect(result.scenes).toHaveLength(1);
  });
});
