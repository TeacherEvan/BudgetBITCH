import { calculateFieldConfidence } from './confidence';
import { extractDate } from './dates';
import { detectCurrency, extractLineItems, extractTax } from './extract_details';
import { extractMerchant } from './extract_merchant';
import { extractTotal } from './extract_total';
import { matchTemplate } from './fingerprint';
import { normalisePayload } from './normalise';
import { generateQuestions } from './questions';
import { categorizeReceipt } from './categorize';
import type { FieldCandidate, FieldName, OcrLine, OcrPayload, ScrapeResult } from './types';
import { validateExtraction } from './validate';
import { detectCurrency as detectCurrencyNew, parseAmount, parseDate, inferCategory } from './currency';
import { inferPaymentMethod } from './payment';

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
  const rawDate = extractDate(fullText, { countryHint: norm.countryHint ?? undefined, now: nowMs });

  const dateCand: FieldCandidate | null = rawDate
    ? {
        value: rawDate.date,
        conf: rawDate.isAmbiguous ? 0.5 : 0.9,
        ruleId: 'date-extractor',
      }
    : null;

  const items = extractLineItems(norm);
  const itemsSum = items.length > 0 ? items.reduce((acc, it) => acc + it.amount, 0) : null;

  // Category: infer from the merchant name via keyword rules. Previously
  // hardcoded to the invalid value 'groceries' (not in ExpenseCategory), which
  // always collapsed to 'other' downstream. A template could later supply an
  // explicit category; for now merchant inference is the only signal.
  const categoryValue = categorizeReceipt(merchantCand?.value as string | undefined, undefined);
  const categoryCand: FieldCandidate = {
    value: categoryValue,
    conf: 0.8,
    ruleId: 'category-infer',
  };

  const validation = validateExtraction({
    total: totalCand ? Number(totalCand.value) : null,
    totalRaw: totalCand?.evidenceLine?.text,
    tax: taxCand ? Number(taxCand.value) : null,
    itemsSum,
    country: norm.countryHint ?? undefined,
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
    category: categoryCand,
    tax: taxCand,
  };

  const confidence: Record<FieldName, number> = {
    total: totalConf,
    date: dateCand?.conf ?? 0,
    merchant: merchantCand?.conf ?? 0,
    currency: currencyCand?.conf ?? 0,
    category: categoryCand.conf,
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

  // Use the enhanced currency detection for payment method and additional currency info
  const paymentMethod = inferPaymentMethod(fullText);
  const currencyHint = detectCurrencyNew(fullText);

  return {
    fields,
    confidence,
    evidence,
    questions,
    lineItems: items,
  };
}
