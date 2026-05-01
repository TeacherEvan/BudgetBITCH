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

function derivePrimaryKeys(input: ResolveLearnRecommendationsInput) {
  const requestedKeys = unique(input.learnModuleKeys);
  const resolvedRequestedKeys = resolveLessonSet(requestedKeys).map((lesson) => lesson.key);

  if (resolvedRequestedKeys.length > 0) {
    return resolvedRequestedKeys;
  }

  const blueprintSignals = new Set([
    ...input.priorityStack,
    ...input.riskWarnings,
  ]);

  const signalMatchedKeys = listLearnModules()
    .filter((lesson) =>
      lesson.blueprintSignals.some((signal) => blueprintSignals.has(signal)),
    )
    .map((lesson) => lesson.key)
    .slice(0, 4);

  return signalMatchedKeys.length > 0 ? signalMatchedKeys : evergreenFallbackKeys;
}

export function resolveLearnRecommendations(
  input: ResolveLearnRecommendationsInput,
) {
  const primaryKeys = derivePrimaryKeys(input);
  const primary = resolveLessonSet(primaryKeys);
  const evergreen = listLearnModules().filter(
    (lesson) => !primary.some((primaryLesson) => primaryLesson.key === lesson.key),
  );

  return {
    primary,
    evergreen,
  };
}
