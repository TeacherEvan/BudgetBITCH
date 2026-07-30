import { describe, expect, test } from 'vitest';
import { loadAllFixtures } from '../../../tests/fixtures/receipts';
import { detectCurrency, extractTax } from './extract-details';
import { extractMerchant } from './extract-merchant';
import { extractTotal } from './extract-total';
import { extractDate } from './dates';
import { scrape } from './engine';
import { runCorpus } from './metrics';
import { normalisePayload } from './normalise';
import type { OcrPayload, ScrapeResult } from './types';
import { validateExtraction } from './validate';

function pipelineScraper(payload: OcrPayload): ScrapeResult {
  return scrape(payload, { now: Date.parse('2026-03-31T00:00:00Z') });
}

describe('Corpus metric harness', () => {
  test('Phase 2 metric evaluation: total accuracy >= 0.80 and avg questions <= 2.0', async () => {
    const fixtures = await loadAllFixtures();
    const metrics = runCorpus(fixtures, pipelineScraper);

    expect(metrics.totalAcc).toBeGreaterThanOrEqual(0.80);
    expect(metrics.avgQuestions).toBeLessThanOrEqual(2.0);
  });
});
