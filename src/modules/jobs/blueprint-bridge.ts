function unique<T>(values: T[]) {
  return [...new Set(values)];
}

type BlueprintJobSignalInput = {
  priorityStack?: string[];
  riskWarnings?: string[];
  learnModuleKeys?: string[];
};

export function extractJobSignalsFromBlueprint(input: BlueprintJobSignalInput) {
  return {
    priorityStack: unique(input.priorityStack ?? []),
    riskWarnings: unique(input.riskWarnings ?? []),
    learnModuleKeys: unique(input.learnModuleKeys ?? []),
  };
}
