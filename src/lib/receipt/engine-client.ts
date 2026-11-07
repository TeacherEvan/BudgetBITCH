import { scrape as sharedScrape } from '../../../convex/lib/receipt/engine';
import type { OcrPayload, ScrapeResult } from '../../../convex/lib/receipt/types';

/**
 * Scrapes receipt offline using the deterministic receipt engine.
 * Converts integer minor units (cents/satang) from engine to major currency units (e.g. 5398 -> 53.98)
 * for consistent downstream consumption across UI and IndexedDB.
 */
export function scrapeOffline(payload: OcrPayload): ScrapeResult {
  const result = sharedScrape(payload);
  const totalVal = result.fields.total?.value;
  const taxVal = result.fields.tax?.value;

  const convertedTotal = typeof totalVal === 'number' && Number.isFinite(totalVal)
    ? Math.round(totalVal) / 100
    : totalVal;

  const convertedTax = typeof taxVal === 'number' && Number.isFinite(taxVal)
    ? Math.round(taxVal) / 100
    : taxVal;

  const convertedItems = (result.items ?? []).map((it) => ({
    ...it,
    amount: Math.round(it.amount) / 100,
    ...(typeof it.unitPrice === 'number' ? { unitPrice: Math.round(it.unitPrice) / 100 } : {}),
  }));

  return {
    ...result,
    fields: {
      ...result.fields,
      total: result.fields.total ? { ...result.fields.total, value: convertedTotal as number } : null,
      tax: result.fields.tax ? { ...result.fields.tax, value: convertedTax as number } : null,
    },
    items: convertedItems,
    lineItems: convertedItems,
  };
}
