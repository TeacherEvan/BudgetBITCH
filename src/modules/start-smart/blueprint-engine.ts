import { resolveRecommendationCatalog } from "./recommendation-catalog";
import type { ConfidenceLabel } from "./regional-seed";

type BlueprintProfileInput = {
  regionKey: string;
  householdKind: string;
  ageBand: string;
  housing: string;
  dependents: number;
  pets: number;
  incomePattern: string;
  debtLoad: string;
  goals: string[];
  riskSignals: string[];
  benefitsSupport?: string[];
  preferredIntegrations: string[];
};

type RegionalCategoryInput = {
  monthly: number;
  confidence: ConfidenceLabel;
};

type BlueprintRegionalInput = {
  regionKey: string;
  housing?: RegionalCategoryInput;
  transport?: RegionalCategoryInput;
  utilities?: RegionalCategoryInput;
  childcare?: RegionalCategoryInput;
  insurance?: RegionalCategoryInput;
};

type GenerateMoneySurvivalBlueprintInput = {
  profile: BlueprintProfileInput;
  regional: BlueprintRegionalInput;
};

function sumMonthly(categories: Array<{ monthly: number }>) {
  return categories.reduce((total, category) => total + category.monthly, 0);
}

export function generateMoneySurvivalBlueprint({
  profile,
  regional,
}: GenerateMoneySurvivalBlueprintInput) {
  const essentials = [
    regional.housing
      ? {
          key: "housing",
          label: "Housing",
          monthly: regional.housing.monthly,
          confidence: regional.housing.confidence,
        }
      : null,
    regional.utilities
      ? {
          key: "utilities",
          label: "Utilities",
          monthly: regional.utilities.monthly,
          confidence: regional.utilities.confidence,
        }
      : null,
    regional.transport
      ? {
          key: "transport",
          label: "Transport",
          monthly: regional.transport.monthly,
          confidence: regional.transport.confidence,
        }
      : null,
    regional.insurance
      ? {
          key: "insurance",
          label: "Insurance",
          monthly: regional.insurance.monthly,
          confidence: regional.insurance.confidence,
        }
      : null,
  ].filter((category): category is NonNullable<typeof category> =>
    Boolean(category),
  );

  const optionalCategories = [
    profile.pets > 0
      ? {
          key: "pet-care",
          label: "Pet care",
          monthly: 80 * profile.pets,
          confidence: "estimated" as const,
        }
      : null,
    profile.dependents > 0 && regional.childcare
      ? {
          key: "childcare",
          label: "Childcare",
          monthly: regional.childcare.monthly,
          confidence: regional.childcare.confidence,
        }
      : null,
  ].filter((category): category is NonNullable<typeof category> =>
    Boolean(category),
  );

  const recommendationSet = resolveRecommendationCatalog({
    debtLoad: profile.debtLoad,
    incomePattern: profile.incomePattern,
    benefitsSupport: profile.benefitsSupport,
    preferredIntegrations: profile.preferredIntegrations,
  });

  const priorityStack = ["cover_essentials"];

  if (
    profile.riskSignals.includes("income_volatility") ||
    profile.riskSignals.includes("housing_instability")
  ) {
    priorityStack.push("stabilize_cash_flow");
  }

  if (
    profile.riskSignals.includes("debt_pressure") ||
    profile.goals.includes("debt_relief")
  ) {
    priorityStack.push("reduce_debt_damage");
  }

  if (profile.goals.includes("emergency_fund")) {
    priorityStack.push("build_emergency_buffer");
  }

  const essentialMonthly = sumMonthly(essentials);
  const emergencyTarget = Math.max(500, Math.round(essentialMonthly));
  const debtPressureSummary =
    profile.debtLoad === "high"
      ? "High debt pressure: stabilize essentials before adding aggressive payoff goals."
      : profile.debtLoad === "moderate"
        ? "Moderate debt pressure: protect minimums and avoid new rollover debt."
        : "Debt pressure is currently limited, so cash-buffer building can take priority.";

  const riskWarnings = [
    ...new Set([
      ...(profile.debtLoad === "high" ? ["high_debt_pressure"] : []),
      ...(profile.riskSignals.includes("income_volatility")
        ? ["income_volatility_risk"]
        : []),
      ...(profile.riskSignals.includes("housing_instability")
        ? ["housing_instability_risk"]
        : []),
      ...recommendationSet.riskWarnings,
    ]),
  ];

  return {
    regionKey: regional.regionKey,
    essentialCategories: essentials,
    optionalCategories,
    priorityStack,
    riskWarnings,
    emergencyTarget,
    debtPressureSummary,
    next7Days: recommendationSet.next7Days,
    next30Days: recommendationSet.next30Days,
    recommendedIntegrations: recommendationSet.recommendedIntegrations,
    learnModuleKeys: recommendationSet.learnModuleKeys,
    appliedRuleIds: recommendationSet.appliedRuleIds,
  };
}
