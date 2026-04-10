import { describe, expect, it } from "vitest";
import { buildDailyCheckIn } from "./daily-check-in";

describe("buildDailyCheckIn", () => {
  it("builds warning alerts when planned spend plus due bills exceed cash", () => {
    const result = buildDailyCheckIn({
      checkInDate: "2026-04-09",
      cashOnHand: 500,
      plannedSpend: 150,
      dueBills: [
        { title: "Rent", amount: 400 },
        { title: "Phone", amount: 60 },
      ],
      categories: [
        { name: "Food", limit: 300, spent: 260 },
        { name: "Gas", limit: 120, spent: 70 },
      ],
    });

    expect(result.summary.remainingAfterPlannedSpend).toBe(-110);
    expect(result.alerts.map((alert) => alert.code)).toEqual([
      "cashflow_negative",
      "category_at_risk",
    ]);
  });

  it("returns a calmer headline when cash remains positive and categories are safe", () => {
    const result = buildDailyCheckIn({
      checkInDate: "2026-04-09",
      cashOnHand: 900,
      plannedSpend: 120,
      dueBills: [{ title: "Phone", amount: 60 }],
      categories: [{ name: "Food", limit: 300, spent: 120 }],
    });

    expect(result.headline).toBe("Today is still inside the plan.");
    expect(result.alerts).toHaveLength(0);
  });
});
