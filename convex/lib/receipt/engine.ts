import { calculateFieldConfidence } from './confidence';
import { extractDate } from './dates';
import { detectCurrency, extractLineItems, extractTax } from './extract-details';
import { extractMerchant } from './extract-merchant';
import { extractTotal } from './extract-total';
import { matchTemplate } from './fingerprint';
import { normalisePayload } from './normalise';
import { generateQuestions } from './questions';
import type { FieldCandidate, FieldName, OcrLine, OcrPayload, ScrapeResult } from './types';
import { validateExtraction } from './validate';

export type EngineOptions = {
  now?: number;
};

export function scrape(payload: OcrPayload, options: EngineOptions = {}): ScrapeResult {
  const norm = normalisePayload(payload);
  const nowMs = options.now ?? Date.now();

  const template = matchTemplate(norm);

  const totalCand = extractTotal(norm);
  const merchantCand = extractMerchant(norm);
  const currencyCand = detectCurrency(norm);
  const taxCand = extractTax(norm);

  // If template matched, override country / currency hints if present
  if (template) {
    if (totalCand) totalCand.conf = Math.min(1.0, totalCand.conf + 0.05);
    if (merchantCand) merchantCand.conf = Math.min(1.0, merchantCand.conf + 0.1);
  }

  const fullText = norm.lines.map((l) => l.text).join(' ');
  const rawDate = extractDate(fullText, { countryHint: norm.countryHint, now: nowMs });

  const dateCand: FieldCandidate | null = rawDate
    ? {
        value: rawDate.date,
        conf: rawDate.isAmbiguous ? 0.5 : 0.9,
        ruleId: 'date-extractor',
      }
    : null;

  const items = extractLineItems(norm);
  const itemsSum = items.length > 0 ? items.reduce((acc, it) => acc + it.amount, 0) : null;

  const validation = validateExtraction({
    total: totalCand ? Number(totalCand.value) : null,
    totalRaw: totalCand?.evidenceLine?.text,
    tax: taxCand ? Number(taxCand.value) : null,
    itemsSum,
    country: norm.countryHint,
    totalConf: totalCand?.conf ?? 0,
  });

  const totalConf = calculateFieldConfidence({
    ruleWeight: totalCand?.conf ?? 0,
    meanOcrConf: totalCand?.evidenceLine?.conf ?? 80,
    validationMultiplier: validation.adjustedTotalConf / Math.max(0.1, totalCand?.conf ?? 0.8),
  });

  const fields: Record<FieldName, FieldCandidate | null> = {
    total: totalCand,
    date: dateCand,
    merchant: merchantCand,
    currency: currencyCand,
    category: { value: 'groceries', conf: 0.8, ruleId: 'default-category' },
    tax: taxCand,
  };

  const confidence: Record<FieldName, number> = {
    total: totalConf,
    date: dateCand?.conf ?? 0,
    merchant: merchantCand?.conf ?? 0,
    currency: currencyCand?.conf ?? 0,
    category: 0.8,
    tax: taxCand?.conf ?? 0,
  };

  const evidence: Record<FieldName, OcrLine | null> = {
    total: totalCand?.evidenceLine ?? null,
    date: null,
    merchant: merchantCand?.evidenceLine ?? null,
    currency: currencyCand?.evidenceLine ?? null,
    category: null,
    tax: taxCand?.evidenceLine ?? null,
  };

  const questions = generateQuestions(fields, confidence);

  return {
    fields,
    confidence,
    evidence,
    questions,
  };
}
