export type ConfidenceParams = {
  ruleWeight: number;
  meanOcrConf: number; // 0..100 or 0..1
  validationMultiplier?: number;
};

export function calculateFieldConfidence(params: ConfidenceParams): number {
  const ocrFactor = params.meanOcrConf > 1 ? params.meanOcrConf / 100 : params.meanOcrConf;
  const mult = params.validationMultiplier ?? 1.0;

  const rawScore = params.ruleWeight * ocrFactor * mult;
  return Math.min(1.0, Math.max(0.0, Math.round(rawScore * 100) / 100));
}
