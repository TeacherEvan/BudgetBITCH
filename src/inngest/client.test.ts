import { describe, expect, it } from "vitest";
import { inngest } from "./client";

describe("inngest client", () => {
  it("uses the shared BudgetBITCH app identifier", () => {
    expect(Reflect.get(inngest, "id")).toBe("budgetbitch");
  });
});
