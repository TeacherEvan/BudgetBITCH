import { describe, expect, test } from 'vitest';
import { loadAllFixtures } from '../../../tests/fixtures/receipts';
import { detectCurrency, extractTax } from './extract-details';
import { extractMerchant } from './extract-merchant';
import { extractTotal } from './extract-total';
import { extractDate } from './dates';
import { runCorpus } from './metrics';
import { normalisePayload } from './normalise';
import type { OcrPayload, ScrapeResult } from './types';
import { validateExtraction } from './validate';

function pipelineScraper(payload: OcrPayload): ScrapeResult {
  const norm = normalisePayload(payload);

  const rawTotalCand = extractTotal(norm);
  const dateCand = extractDate(
    norm.lines.map((l) => l.text).join(' '),
    { countryHint: norm.countryHint, now: Date.parse('2026-03-31T00:00:00Z') }
  );
  const merchantCand = extractMerchant(norm);
  const currencyCand = detectCurrency(norm);
  const taxCand = extractTax(norm);

  const valRes = validateExtraction({
    total: rawTotalCand ? Number(rawTotalCand.value) : null,
    totalRaw: rawTotalCand?.evidenceLine?.text,
    tax: taxCand ? Number(taxCand.value) : null,
    country: norm.countryHint,
    totalConf: rawTotalCand?.conf ?? 0,
  });

  const finalTotalConf = valRes.adjustedTotalConf;

  return {
    fields: {
      total: rawTotalCand,
      date: dateCand ? { value: dateCand.date, conf: dateCand.isAmbiguous ? 0.5 : 0.9, ruleId: 'date-extractor' } : null,
      merchant: merchantCand,
      currency: currencyCand,
      category: { value: 'groceries', conf: 0.8, ruleId: 'default-category' },
      tax: taxCand,
    },
    confidence: {
      total: finalTotalConf,
      date: dateCand ? (dateCand.isAmbiguous ? 0.5 : 0.9) : 0,
      merchant: merchantCand?.conf ?? 0,
      currency: currencyCand?.conf ?? 0,
      category: 0.8,
      tax: taxCand?.conf ?? 0,
    },
    evidence: {
      total: rawTotalCand?.evidenceLine ?? null,
      date: null,
      merchant: merchantCand?.evidenceLine ?? null,
      currency: currencyCand?.evidenceLine ?? null,
      category: null,
      tax: taxCand?.evidenceLine ?? null,
    },
    questions: [],
  };
}

describe('Corpus metric harness', () => {
  test('Phase 1 metric evaluation: total accuracy >= 0.80 across corpus', async () => {
    const fixtures = await loadAllFixtures();
    const metrics = runCorpus(fixtures, pipelineScraper);

    expect(metrics.totalAcc).toBeGreaterThanOrEqual(0.80);
    expect(metrics.dateAcc).toBeGreaterThanOrEqual(0.70);
    expect(metrics.merchantAcc).toBeGreaterThanOrEqual(0.75);
  });
});
