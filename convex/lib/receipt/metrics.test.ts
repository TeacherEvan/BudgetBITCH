import { describe, expect, test } from 'vitest';
import { loadAllFixtures } from '../../../tests/fixtures/receipts';
import { detectCurrency, extractTax } from './extract_details';
import { extractMerchant } from './extract_merchant';
import { extractTotal } from './extract_total';
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
  test('Phase 5 golden metric evaluation: total >= 0.90, date >= 0.85, merchant >= 0.80, avgQuestions <= 1.2', async () => {
    const fixtures = await loadAllFixtures();
    const metrics = runCorpus(fixtures, pipelineScraper);

    expect(metrics.totalAcc).toBeGreaterThanOrEqual(0.90);
    expect(metrics.dateAcc).toBeGreaterThanOrEqual(0.85);
    expect(metrics.merchantAcc).toBeGreaterThanOrEqual(0.80);
    expect(metrics.avgQuestions).toBeLessThanOrEqual(1.2);
  });
});
