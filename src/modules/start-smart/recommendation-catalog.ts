type RecommendationRule = {
  id: string;
  when: (input: {
    debtLoad?: string;
    incomePattern?: string;
    benefitsSupport?: string[];
    preferredIntegrations?: string[];
  }) => boolean;
  learnModules?: string[];
  integrations?: string[];
  next7Days?: string[];
  next30Days?: string[];
  warnings?: string[];
};

const recommendationRules: RecommendationRule[] = [
  {
    id: "core-budgeting-basics",
    when: () => true,
    learnModules: ["budgeting_basics"],
    next7Days: [
      "List all fixed bills",
      "Separate must-pay costs from optional spending",
    ],
    next30Days: ["Build starter emergency buffer"],
  },
  {
    id: "income-volatility-stability",
    when: ({ incomePattern }) =>
      incomePattern === "variable" || incomePattern === "seasonal",
    learnModules: ["income_variability"],
    next7Days: ["Build a bare-minimum survival budget for low-income weeks"],
    next30Days: ["Create an income smoothing buffer for uneven pay periods"],
    warnings: ["income_volatility_risk"],
  },
  {
    id: "debt-triage",
    when: ({ debtLoad }) => debtLoad === "moderate" || debtLoad === "high",
    learnModules: ["debt_triage"],
    next7Days: ["Confirm every minimum debt payment and due date"],
    next30Days: ["Choose a debt attack strategy once essentials are stable"],
    warnings: ["high_debt_pressure"],
  },
  {
    id: "benefits-protection",
    when: ({ benefitsSupport }) =>
      (benefitsSupport ?? []).some((value) => value !== "none"),
    learnModules: ["benefits_protection"],
    next30Days: ["Review how income changes could affect benefit eligibility"],
    warnings: ["benefits_change_risk"],
  },
  {
    id: "preferred-integration-followthrough",
    when: ({ preferredIntegrations }) =>
      (preferredIntegrations ?? []).length > 0,
    integrations: [],
  },
];

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

export function resolveRecommendationCatalog(input: {
  debtLoad?: string;
  incomePattern?: string;
  benefitsSupport?: string[];
  preferredIntegrations?: string[];
}) {
  const appliedRules = recommendationRules.filter((rule) => rule.when(input));

  return {
    appliedRuleIds: appliedRules.map((rule) => rule.id),
    learnModuleKeys: unique(
      appliedRules.flatMap((rule) => rule.learnModules ?? []),
    ),
    recommendedIntegrations: unique([
      ...appliedRules.flatMap((rule) => rule.integrations ?? []),
      ...(input.preferredIntegrations ?? []),
    ]),
    next7Days: unique(appliedRules.flatMap((rule) => rule.next7Days ?? [])),
    next30Days: unique(appliedRules.flatMap((rule) => rule.next30Days ?? [])),
    riskWarnings: unique(appliedRules.flatMap((rule) => rule.warnings ?? [])),
  };
}
