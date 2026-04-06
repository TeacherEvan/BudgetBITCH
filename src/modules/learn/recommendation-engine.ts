import {
  getLearnModuleByKey,
  listLearnModules,
} from "./module-catalog";
import type { LearnLesson, LearnModuleKey } from "./module-schema";

type ResolveLearnRecommendationsInput = {
  learnModuleKeys: LearnModuleKey[];
  priorityStack: string[];
  riskWarnings: string[];
};

const evergreenFallbackKeys: LearnModuleKey[] = [
  "budgeting_basics",
  "money_behavior",
  "inflation_opportunity_cost",
];

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

function resolveLessonSet(keys: LearnModuleKey[]) {
  return keys
    .map((key) => getLearnModuleByKey(key))
    .filter((lesson): lesson is LearnLesson => Boolean(lesson));
}

function buildExplainers(input: ResolveLearnRecommendationsInput) {
  const explainers: string[] = [];

  if (
    input.priorityStack.includes("cover_essentials") &&
    input.priorityStack.includes("reduce_debt_damage")
  ) {
    explainers.push(
      "These lessons are recommended because your blueprint prioritizes essentials and debt damage control.",
    );
  }

  if (input.riskWarnings.includes("income_volatility_risk")) {
    explainers.push(
      "Your blueprint shows income volatility risk, so the lesson order emphasizes stability and low-month planning.",
    );
  }

  if (input.riskWarnings.includes("benefits_change_risk")) {
    explainers.push(
      "Your blueprint flags benefits-change risk, so the recommendations emphasize documentation and timing awareness.",
    );
  }

  if (explainers.length === 0) {
    explainers.push(
      "These lessons are matched to your current blueprint priorities so the learning stays practical.",
    );
  }

  return explainers;
}

export function resolveLearnRecommendations(
  input: ResolveLearnRecommendationsInput,
) {
  const requestedKeys = unique(input.learnModuleKeys);
  const primaryKeys =
    requestedKeys.length > 0 ? requestedKeys : evergreenFallbackKeys;
  const primary = resolveLessonSet(primaryKeys);
  const evergreen = listLearnModules().filter(
    (lesson) => !primary.some((primaryLesson) => primaryLesson.key === lesson.key),
  );

  return {
    primary,
    evergreen,
    explainers: buildExplainers({
      ...input,
      learnModuleKeys: requestedKeys,
    }),
  };
}
