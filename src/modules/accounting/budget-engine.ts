type BudgetCategoryInput = {
  id: string;
  name: string;
  monthlyLimit: number;
};

type ExpenseInput = {
  budgetCategoryId?: string | null;
  amount: number;
};

type BillInput = {
  id: string;
  title: string;
  amount: number;
  dueInDays: number;
};

type AccountInput = {
  balance: number;
};

type BuildBudgetSnapshotInput = {
  categories: BudgetCategoryInput[];
  expenses: ExpenseInput[];
  bills: BillInput[];
  accounts: AccountInput[];
};

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function roundRatio(value: number) {
  return Math.round((value + Number.EPSILON) * 10_000) / 10_000;
}

function getCategoryStatus(ratio: number) {
  if (ratio >= 1) {
    return "over" as const;
  }

  if (ratio >= 0.8) {
    return "at_risk" as const;
  }

  return "safe" as const;
}

export function buildBudgetSnapshot(input: BuildBudgetSnapshotInput) {
  const categories = input.categories.map((category) => {
    const spent = roundCurrency(
      input.expenses
        .filter((expense) => expense.budgetCategoryId === category.id)
        .reduce((total, expense) => total + expense.amount, 0),
    );
    const remaining = roundCurrency(category.monthlyLimit - spent);
    const ratio = category.monthlyLimit > 0 ? roundRatio(spent / category.monthlyLimit) : 0;

    return {
      ...category,
      spent,
      remaining,
      ratio,
      status: getCategoryStatus(ratio),
    };
  });

  const dueSoonBills = input.bills.filter((bill) => bill.dueInDays <= 7);
  const availableCash = roundCurrency(
    input.accounts.reduce((total, account) => total + account.balance, 0),
  );
  const dueSoonTotal = roundCurrency(
    dueSoonBills.reduce((total, bill) => total + bill.amount, 0),
  );
  const spentTotal = roundCurrency(
    input.expenses.reduce((total, expense) => total + expense.amount, 0),
  );
  const netCashflow = roundCurrency(availableCash - dueSoonTotal - spentTotal);

  return {
    categories,
    dueSoonBills,
    cashflow: {
      availableCash,
      dueSoonTotal,
      spentTotal,
      netCashflow,
      status: netCashflow < 0 ? ("negative" as const) : ("positive" as const),
    },
  };
}