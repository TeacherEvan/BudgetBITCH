export type RuleStatParams = {
  baseWeight: number;
  matches: number;
  corrections: number;
};

export type RuleEvaluation = {
  weight: number;
  isDemoted: boolean;
  correctionRate: number;
};

export function evaluateRuleWeight(params: RuleStatParams): RuleEvaluation {
  if (params.matches < 20) {
    return {
      weight: params.baseWeight,
      isDemoted: false,
      correctionRate: params.matches > 0 ? params.corrections / params.matches : 0,
    };
  }

  const correctionRate = params.corrections / params.matches;

  if (correctionRate > 0.3) {
    // Demote weight proportionally to error rate
    const demotedWeight = Math.max(0.3, Math.round((params.baseWeight * (1 - correctionRate)) * 100) / 100);
    return {
      weight: demotedWeight,
      isDemoted: true,
      correctionRate,
    };
  }

  return {
    weight: params.baseWeight,
    isDemoted: false,
    correctionRate,
  };
}
