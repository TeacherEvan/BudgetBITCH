import { describe, expect, test } from 'vitest';
import { generateQuestions } from './questions';
import type { FieldCandidate, FieldName, OcrLine } from './types';

describe('Verification question generator', () => {
  const dummyLine: OcrLine = {
    text: 'TOTAL 150.00',
    conf: 50,
    y: 100,
    words: [],
  };

  test('emits question when total confidence is low (< 0.85)', () => {
    const fields: Record<FieldName, FieldCandidate | null> = {
      total: { value: 150.0, conf: 0.5, evidenceLine: dummyLine, ruleId: 'rule' },
      date: { value: '2026-03-15', conf: 0.9, ruleId: 'rule' },
      merchant: { value: 'CHECKERS', conf: 0.9, ruleId: 'rule' },
      currency: { value: 'ZAR', conf: 0.9, ruleId: 'rule' },
      category: { value: 'groceries', conf: 0.9, ruleId: 'rule' },
      tax: null,
    };
    const confidence: Record<FieldName, number> = {
      total: 0.5,
      date: 0.9,
      merchant: 0.9,
      currency: 0.9,
      category: 0.9,
      tax: 0,
    };

    const questions = generateQuestions(fields, confidence);
    expect(questions.length).toBeGreaterThan(0);
    expect(questions[0].field).toBe('total');
  });

  test('caps max questions at 3 and orders total -> date -> merchant -> category', () => {
    const fields: Record<FieldName, FieldCandidate | null> = {
      total: { value: 150.0, conf: 0.4, ruleId: 'rule' },
      date: { value: '2026-03-15', conf: 0.4, ruleId: 'rule' },
      merchant: { value: 'CHECKERS', conf: 0.4, ruleId: 'rule' },
      currency: { value: 'ZAR', conf: 0.4, ruleId: 'rule' },
      category: { value: 'groceries', conf: 0.4, ruleId: 'rule' },
      tax: null,
    };
    const confidence: Record<FieldName, number> = {
      total: 0.4,
      date: 0.4,
      merchant: 0.4,
      currency: 0.4,
      category: 0.4,
      tax: 0,
    };

    const questions = generateQuestions(fields, confidence);
    expect(questions.length).toBeLessThanOrEqual(3);
    expect(questions[0].field).toBe('total');
    expect(questions[1].field).toBe('date');
    expect(questions[2].field).toBe('merchant');
  });
});
