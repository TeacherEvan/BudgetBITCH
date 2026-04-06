type CategoryInput = {
  name: string;
  limit: number;
  spent: number;
};

type BudgetHealthInput = {
  categories: CategoryInput[];
};

export function getBudgetHealth(input: BudgetHealthInput) {
  return {
    categories: input.categories.map((category) => {
      const ratio = category.limit === 0 ? 0 : category.spent / category.limit;

      return {
        ...category,
        ratio,
        status: ratio >= 1 ? "over" : ratio >= 0.8 ? "at_risk" : "safe",
      };
    }),
  };
}
