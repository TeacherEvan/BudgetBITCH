import { describe, expect, it } from "vitest";
import { buildBudgetSnapshot } from "./budget-engine";

describe("buildBudgetSnapshot", () => {
  it("derives category health and remaining balances from recorded expenses", () => {
    const result = buildBudgetSnapshot({
      categories: [
        { id: "food", name: "Food", monthlyLimit: 400 },
        { id: "transport", name: "Transport", monthlyLimit: 120 },
      ],
      expenses: [
        { budgetCategoryId: "food", amount: 120 },
        { budgetCategoryId: "food", amount: 210 },
        { budgetCategoryId: "transport", amount: 80 },
      ],
      bills: [],
      accounts: [{ balance: 1800 }],
    });

    expect(result.categories).toEqual([
      {
        id: "food",
        name: "Food",
        monthlyLimit: 400,
        spent: 330,
        remaining: 70,
        ratio: 0.825,
        status: "at_risk",
      },
      {
        id: "transport",
        name: "Transport",
        monthlyLimit: 120,
        spent: 80,
        remaining: 40,
        ratio: 0.6667,
        status: "safe",
      },
    ]);
  });

  it("includes due-soon bills and net cashflow against account balances", () => {
    const result = buildBudgetSnapshot({
      categories: [{ id: "housing", name: "Housing", monthlyLimit: 1000 }],
      expenses: [{ budgetCategoryId: "housing", amount: 950 }],
      bills: [
        { id: "rent", title: "Rent", amount: 1000, dueInDays: 2 },
        { id: "phone", title: "Phone", amount: 80, dueInDays: 10 },
      ],
      accounts: [{ balance: 900 }, { balance: 350 }],
    });

    expect(result.cashflow).toEqual({
      availableCash: 1250,
      dueSoonTotal: 1000,
      spentTotal: 950,
      netCashflow: -700,
      status: "negative",
    });
    expect(result.dueSoonBills).toEqual([
      { id: "rent", title: "Rent", amount: 1000, dueInDays: 2 },
    ]);
  });
});