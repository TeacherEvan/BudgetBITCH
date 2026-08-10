import { describe, expect, test } from 'vitest';
import { evaluateRuleWeight } from './learning';

describe('Self-healing rule demotion', () => {
  test('retains original weight if samples count < 20', () => {
    const res = evaluateRuleWeight({
      baseWeight: 0.9,
      matches: 10,
      corrections: 5, // 50% corrections, but < 20 samples
    });

    expect(res.weight).toBe(0.9);
    expect(res.isDemoted).toBe(false);
  });

  test('demotes rule weight when correction rate exceeds 30% over >= 20 samples', () => {
    const res = evaluateRuleWeight({
      baseWeight: 0.9,
      matches: 30,
      corrections: 12, // 40% corrections
    });

    expect(res.weight).toBeLessThan(0.9);
    expect(res.isDemoted).toBe(true);
  });
});
