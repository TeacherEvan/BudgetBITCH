import {
  runDailyCheckInEngine,
  type DailyCheckInAlertCandidate,
} from "./daily-check-in-engine";

export type DailyCheckInDueBill = {
  title: string;
  amount: number;
};

export type DailyCheckInCategorySnapshot = {
  name: string;
  limit: number;
  spent: number;
};

export type DailyCheckInInput = {
  checkInDate: string;
  cashOnHand: number;
  plannedSpend: number;
  dueBills: DailyCheckInDueBill[];
  categories: DailyCheckInCategorySnapshot[];
};

export type DailyCheckInAlert = DailyCheckInAlertCandidate;

export function buildDailyCheckIn(input: DailyCheckInInput) {
  const dueBillTotal = input.dueBills.reduce((sum, bill) => sum + bill.amount, 0);
  const result = runDailyCheckInEngine({
    checkInDate: input.checkInDate,
    cashflow: {
      availableCash: input.cashOnHand,
      plannedOutflow: input.plannedSpend,
      committedOutflow: dueBillTotal,
    },
    categories: input.categories.map((category) => ({
      categoryId: category.name,
      categoryName: category.name,
      budgetedAmount: category.limit,
      spentAmount: category.spent,
    })),
  });

  return {
    headline: result.headline,
    summary: {
      checkInDate: result.summary.checkInDate,
      cashOnHand: result.summary.cashflow.availableCash,
      plannedSpend: result.summary.cashflow.plannedOutflow,
      dueBillTotal: result.summary.cashflow.committedOutflow,
      remainingAfterPlannedSpend: result.summary.cashflow.netCashflow,
    },
    alerts: result.alerts,
  };
}
