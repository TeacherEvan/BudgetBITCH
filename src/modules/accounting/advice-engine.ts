type AdviceCategoryInput = {
  name: string;
  ratio: number;
  status: "safe" | "at_risk" | "over";
};

type AdviceCashflowInput = {
  availableCash: number;
  dueSoonTotal: number;
  spentTotal: number;
  netCashflow: number;
  status: "positive" | "negative";
};

type BuildBudgetAdviceInput = {
  categories: AdviceCategoryInput[];
  cashflow: AdviceCashflowInput;
};

export type BudgetAdviceCard = {
  id: string;
  title: string;
  detail: string;
  learnSlug: string;
  severity: "warning" | "critical" | "info";
};

export function buildBudgetAdvice(input: BuildBudgetAdviceInput) {
  const advice: BudgetAdviceCard[] = [];
  const riskyCategory = input.categories.find((category) => category.status === "at_risk");
  const overCategory = input.categories.find((category) => category.status === "over");

  if (input.cashflow.status === "negative") {
    advice.push({
      id: "negative-cashflow",
      title: "Cover essentials before anything flexible.",
      detail:
        "Your near-term cashflow is below zero. Re-rank bills and discretionary spending today.",
      learnSlug: "cashflow-triage",
      severity: "critical",
    });
  }

  if (overCategory) {
    advice.push({
      id: "over-budget-categories",
      title: "Stop one over-budget leak before the next purchase.",
      detail: `${overCategory.name} is already over budget. Pause or replace that spend first.`,
      learnSlug: "category-guardrails",
      severity: "critical",
    });
  } else if (riskyCategory) {
    advice.push({
      id: "at-risk-categories",
      title: "Pull one variable category back this week.",
      detail: `${riskyCategory.name} is already above 80% of budget. Use a tighter envelope until the next reset.`,
      learnSlug: "category-guardrails",
      severity: "warning",
    });
  }

  if (advice.length === 0) {
    advice.push({
      id: "steady-plan",
      title: "Keep the plan boring for another week.",
      detail: "Your cashflow and categories are still stable. Protect that by avoiding new fixed costs.",
      learnSlug: "steady-spending",
      severity: "info",
    });
  }

  return advice;
}