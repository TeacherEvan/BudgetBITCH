import type { LearnModuleKey } from "./module-schema";

type BlueprintLearnSignalInput = {
  priorityStack?: string[];
  riskWarnings?: string[];
  learnModuleKeys?: string[];
};

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

export function extractLearnSignalsFromBlueprint(
  input: BlueprintLearnSignalInput,
) {
  return {
    priorityStack: unique(input.priorityStack ?? []),
    riskWarnings: unique(input.riskWarnings ?? []),
    learnModuleKeys: unique(
      (input.learnModuleKeys ?? []) as LearnModuleKey[],
    ),
  };
}
