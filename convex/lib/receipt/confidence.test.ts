import { describe, expect, test } from 'vitest';
import { calculateFieldConfidence } from './confidence';

describe('Per-field confidence scoring', () => {
  test('calculates high confidence (>= 0.85) for clean evidence and valid arithmetic', () => {
    const score = calculateFieldConfidence({
      ruleWeight: 0.95,
      meanOcrConf: 92, // 92% -> 0.92
      validationMultiplier: 1.0,
    });

    expect(score).toBeGreaterThanOrEqual(0.85);
  });

  test('calculates mid confidence (0.55 - 0.85) for faded OCR', () => {
    const score = calculateFieldConfidence({
      ruleWeight: 0.85,
      meanOcrConf: 70, // 70% -> 0.70
      validationMultiplier: 1.0,
    });

    expect(score).toBeGreaterThanOrEqual(0.55);
    expect(score).toBeLessThan(0.85);
  });

  test('calculates low confidence (< 0.55) when validation fails or rule weight is low', () => {
    const score = calculateFieldConfidence({
      ruleWeight: 0.6,
      meanOcrConf: 60, // 0.60
      validationMultiplier: 0.7, // Penalised
    });

    expect(score).toBeLessThan(0.55);
  });
});
