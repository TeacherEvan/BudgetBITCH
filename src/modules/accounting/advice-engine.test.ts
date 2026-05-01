import { describe, expect, it } from "vitest";
import { buildBudgetAdvice } from "./advice-engine";

describe("buildBudgetAdvice", () => {
  it("suggests tightening variable spending when categories are at risk", () => {
    const result = buildBudgetAdvice({
      categories: [
        { name: "Food", ratio: 0.88, status: "at_risk" },
        { name: "Housing", ratio: 0.55, status: "safe" },
      ],
      cashflow: {
        availableCash: 1400,
        dueSoonTotal: 400,
        spentTotal: 920,
        netCashflow: 80,
        status: "positive",
      },
    });

    expect(result[0]).toEqual({
      id: "at-risk-categories",
      title: "Pull one variable category back this week.",
      detail: "Food is already above 80% of budget. Use a tighter envelope until the next reset.",
      learnSlug: "category-guardrails",
      severity: "warning",
    });
  });

  it("suggests a zero-based triage when cashflow is negative", () => {
    const result = buildBudgetAdvice({
      categories: [],
      cashflow: {
        availableCash: 900,
        dueSoonTotal: 1000,
        spentTotal: 250,
        netCashflow: -350,
        status: "negative",
      },
    });

    expect(result[0]).toEqual({
      id: "negative-cashflow",
      title: "Cover essentials before anything flexible.",
      detail: "Your near-term cashflow is below zero. Re-rank bills and discretionary spending today.",
      learnSlug: "cashflow-triage",
      severity: "critical",
    });
  });
});