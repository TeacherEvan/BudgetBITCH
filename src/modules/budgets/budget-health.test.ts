import { describe, expect, it } from "vitest";
import { getBudgetHealth } from "./budget-health";

describe("getBudgetHealth", () => {
  it("marks categories over 80 percent spent as at_risk", () => {
    const result = getBudgetHealth({
      categories: [{ name: "Food", limit: 500, spent: 450 }],
    });

    expect(result.categories[0]).toEqual({
      name: "Food",
      limit: 500,
      spent: 450,
      ratio: 0.9,
      status: "at_risk",
    });
  });

  it("marks categories over 100 percent as over", () => {
    const result = getBudgetHealth({
      categories: [{ name: "Fun", limit: 100, spent: 140 }],
    });

    expect(result.categories[0].status).toBe("over");
  });
});
