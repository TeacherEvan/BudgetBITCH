import { describe, expect, it } from "vitest";
import {
  getLearnModuleByKey,
  getLearnModuleBySlug,
  listLearnModules,
} from "./module-catalog";

describe("module-catalog", () => {
  it("contains the initial blueprint-driven lesson modules", () => {
    const modules = listLearnModules();

    expect(modules.some((module) => module.key === "budgeting_basics")).toBe(
      true,
    );
    expect(modules.some((module) => module.key === "income_variability")).toBe(
      true,
    );
    expect(modules.some((module) => module.key === "debt_triage")).toBe(true);
    expect(modules.some((module) => module.key === "benefits_protection")).toBe(
      true,
    );
  });

  it("supports lookup by key and slug", () => {
    expect(getLearnModuleByKey("budgeting_basics")?.slug).toBe(
      "budgeting-basics",
    );
    expect(getLearnModuleBySlug("debt-triage")?.key).toBe("debt_triage");
  });
});
