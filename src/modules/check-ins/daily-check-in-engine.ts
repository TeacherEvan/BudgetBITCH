export type DailyCheckInAlertCode = "cashflow_negative" | "category_at_risk";

export type DailyCheckInAlertSeverity = "warning" | "critical";

export type DailyCheckInAlertMetadata = Record<
  string,
  number | string | string[]
>;

export type DailyCheckInAlertCandidate = {
  code: DailyCheckInAlertCode;
  severity: DailyCheckInAlertSeverity;
  title: string;
  message: string;
  metadata: DailyCheckInAlertMetadata;
};

export type DailyCheckInCategoryStatus = "safe" | "at_risk" | "over_budget";

export type DailyCheckInCategoryInput = {
  categoryId: string;
  categoryName: string;
  budgetedAmount: number;
  spentAmount: number;
};

export type DailyCheckInEngineInput = {
  checkInDate: string;
  cashflow: {
    availableCash: number;
    plannedOutflow: number;
    committedOutflow: number;
  };
  categories: DailyCheckInCategoryInput[];
};

export type DailyCheckInSummary = {
  checkInDate: string;
  cashflow: {
    availableCash: number;
    plannedOutflow: number;
    committedOutflow: number;
    totalOutflow: number;
    netCashflow: number;
    status: "positive" | "negative";
  };
  categories: Array<
    DailyCheckInCategoryInput & {
      remainingAmount: number;
      spentRatio: number;
      status: DailyCheckInCategoryStatus;
    }
  >;
  categoryCounts: {
    safe: number;
    atRisk: number;
    overBudget: number;
  };
  alertCount: number;
};

export type DailyCheckInEngineResult = {
  headline: string;
  summary: DailyCheckInSummary;
  alerts: DailyCheckInAlertCandidate[];
};

const AT_RISK_RATIO = 0.8;

function roundToCents(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function roundRatio(value: number) {
  return Math.round((value + Number.EPSILON) * 10_000) / 10_000;
}

function getSpentRatio(category: DailyCheckInCategoryInput) {
  if (category.budgetedAmount <= 0) {
    return category.spentAmount <= 0 ? 0 : 1;
  }

  return roundRatio(category.spentAmount / category.budgetedAmount);
}

function getCategoryStatus(
  category: DailyCheckInCategoryInput,
  spentRatio: number,
): DailyCheckInCategoryStatus {
  if (category.budgetedAmount <= 0) {
    return category.spentAmount <= 0 ? "safe" : "over_budget";
  }

  if (spentRatio >= 1) {
    return "over_budget";
  }

  if (spentRatio >= AT_RISK_RATIO) {
    return "at_risk";
  }

  return "safe";
}

function buildHeadline(alerts: DailyCheckInAlertCandidate[]) {
  if (alerts.some((alert) => alert.severity === "critical")) {
    return "Today needs a tighter plan.";
  }

  if (alerts.length > 0) {
    return "Today needs a closer look.";
  }

  return "Today is still inside the plan.";
}

export function runDailyCheckInEngine(
  input: DailyCheckInEngineInput,
): DailyCheckInEngineResult {
  const categories = input.categories.map((category) => {
    const spentRatio = getSpentRatio(category);
    const status = getCategoryStatus(category, spentRatio);

    return {
      ...category,
      remainingAmount: roundToCents(category.budgetedAmount - category.spentAmount),
      spentRatio,
      status,
    };
  });

  const totalOutflow = roundToCents(
    input.cashflow.plannedOutflow + input.cashflow.committedOutflow,
  );
  const netCashflow = roundToCents(input.cashflow.availableCash - totalOutflow);
  const riskyCategories = categories.filter((category) => category.status !== "safe");
  const alerts: DailyCheckInAlertCandidate[] = [];

  if (netCashflow < 0) {
    alerts.push({
      code: "cashflow_negative",
      severity: "critical",
      title: "Planned cash goes negative today.",
      message:
        "Your available cash and planned outflows put today below zero.",
      metadata: {
        availableCash: input.cashflow.availableCash,
        totalOutflow,
        netCashflow,
      },
    });
  }

  if (riskyCategories.length > 0) {
    const overBudgetCount = riskyCategories.filter(
      (category) => category.status === "over_budget",
    ).length;

    alerts.push({
      code: "category_at_risk",
      severity: overBudgetCount > 0 ? "critical" : "warning",
      title:
        overBudgetCount > 0
          ? "One or more categories are already over budget."
          : "One or more categories are close to the limit.",
      message:
        overBudgetCount > 0
          ? "Rebalance spending in categories that already exceed the budget."
          : "Tighten spending in categories that are already above 80% of the budget.",
      metadata: {
        categoryCount: riskyCategories.length,
        atRiskCount: riskyCategories.length - overBudgetCount,
        overBudgetCount,
        categoryIds: riskyCategories.map((category) => category.categoryId),
        categoryNames: riskyCategories.map((category) => category.categoryName),
        highestSpentRatio: Math.max(
          ...riskyCategories.map((category) => category.spentRatio),
        ),
      },
    });
  }

  const summary: DailyCheckInSummary = {
    checkInDate: input.checkInDate,
    cashflow: {
      availableCash: input.cashflow.availableCash,
      plannedOutflow: input.cashflow.plannedOutflow,
      committedOutflow: input.cashflow.committedOutflow,
      totalOutflow,
      netCashflow,
      status: netCashflow < 0 ? "negative" : "positive",
    },
    categories,
    categoryCounts: {
      safe: categories.filter((category) => category.status === "safe").length,
      atRisk: categories.filter((category) => category.status === "at_risk").length,
      overBudget: categories.filter(
        (category) => category.status === "over_budget",
      ).length,
    },
    alertCount: alerts.length,
  };

  return {
    headline: buildHeadline(alerts),
    summary,
    alerts,
  };
}
