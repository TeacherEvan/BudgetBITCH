import { describe, expect, test } from 'vitest';
import { loadAllFixtures } from '../../../tests/fixtures/receipts';
import { runCorpus } from './metrics';
import type { ScrapeResult } from './types';

// Dummy stub scraper function for Phase 0 harness testing
function stubScraper(): ScrapeResult {
  return {
    fields: {
      total: null,
      date: null,
      merchant: null,
      category: null,
      currency: null,
      tax: null,
    },
    confidence: {
      total: 0,
      date: 0,
      merchant: 0,
      category: 0,
      currency: 0,
      tax: 0,
    },
    evidence: {
      total: null,
      date: null,
      merchant: null,
      category: null,
      currency: null,
      tax: null,
    },
    questions: [],
  };
}

describe('Corpus metric harness', () => {
  test('evaluates corpus fixtures and returns accuracy metrics', async () => {
    const fixtures = await loadAllFixtures();
    const metrics = runCorpus(fixtures, stubScraper);

    expect(metrics).toBeDefined();
    expect(typeof metrics.totalAcc).toBe('number');
    expect(typeof metrics.dateAcc).toBe('number');
    expect(typeof metrics.merchantAcc).toBe('number');
    expect(typeof metrics.avgQuestions).toBe('number');
    expect(Array.isArray(metrics.failures)).toBe(true);

    // With a stub scraper, accuracy should be 0
    expect(metrics.totalAcc).toBe(0);
    const totalFailures = metrics.failures.filter((f) => f.field === 'total');
    expect(totalFailures.length).toBe(fixtures.length);
  });
});
