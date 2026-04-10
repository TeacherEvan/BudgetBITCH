import { describe, expect, it } from "vitest";
import { runDailyCheckInEngine } from "./daily-check-in-engine";

describe("runDailyCheckInEngine", () => {
  it("raises a critical alert when planned cashflow goes negative", () => {
    const result = runDailyCheckInEngine({
      checkInDate: "2026-04-09",
      cashflow: {
        availableCash: 500,
        plannedOutflow: 150,
        committedOutflow: 400,
      },
      categories: [],
    });

    expect(result.headline).toBe("Today needs a tighter plan.");
    expect(result.summary.cashflow).toEqual({
      availableCash: 500,
      plannedOutflow: 150,
      committedOutflow: 400,
      totalOutflow: 550,
      netCashflow: -50,
      status: "negative",
    });
    expect(result.alerts).toContainEqual({
      code: "cashflow_negative",
      severity: "critical",
      title: "Planned cash goes negative today.",
      message: "Your available cash and planned outflows put today below zero.",
      metadata: {
        availableCash: 500,
        totalOutflow: 550,
        netCashflow: -50,
      },
    });
  });

  it("builds a warning alert when categories are close to their limits", () => {
    const result = runDailyCheckInEngine({
      checkInDate: "2026-04-09",
      cashflow: {
        availableCash: 900,
        plannedOutflow: 120,
        committedOutflow: 60,
      },
      categories: [
        {
          categoryId: "food",
          categoryName: "Food",
          budgetedAmount: 300,
          spentAmount: 260,
        },
        {
          categoryId: "gas",
          categoryName: "Gas",
          budgetedAmount: 120,
          spentAmount: 70,
        },
      ],
    });

    expect(result.headline).toBe("Today needs a closer look.");
    expect(result.summary.categoryCounts).toEqual({
      safe: 1,
      atRisk: 1,
      overBudget: 0,
    });
    expect(result.summary.categories[0]).toEqual({
      categoryId: "food",
      categoryName: "Food",
      budgetedAmount: 300,
      spentAmount: 260,
      remainingAmount: 40,
      spentRatio: 0.8667,
      status: "at_risk",
    });
    expect(result.alerts).toContainEqual({
      code: "category_at_risk",
      severity: "warning",
      title: "One or more categories are close to the limit.",
      message:
        "Tighten spending in categories that are already above 80% of the budget.",
      metadata: {
        categoryCount: 1,
        atRiskCount: 1,
        overBudgetCount: 0,
        categoryIds: ["food"],
        categoryNames: ["Food"],
        highestSpentRatio: 0.8667,
      },
    });
  });

  it("escalates the category alert when a category is already over budget", () => {
    const result = runDailyCheckInEngine({
      checkInDate: "2026-04-09",
      cashflow: {
        availableCash: 900,
        plannedOutflow: 120,
        committedOutflow: 60,
      },
      categories: [
        {
          categoryId: "fun",
          categoryName: "Fun",
          budgetedAmount: 100,
          spentAmount: 140,
        },
      ],
    });

    expect(result.headline).toBe("Today needs a tighter plan.");
    expect(result.summary.categories[0]?.status).toBe("over_budget");
    expect(result.alerts).toContainEqual({
      code: "category_at_risk",
      severity: "critical",
      title: "One or more categories are already over budget.",
      message: "Rebalance spending in categories that already exceed the budget.",
      metadata: {
        categoryCount: 1,
        atRiskCount: 0,
        overBudgetCount: 1,
        categoryIds: ["fun"],
        categoryNames: ["Fun"],
        highestSpentRatio: 1.4,
      },
    });
  });
});
