import { scrape as sharedScrape } from '../../../convex/lib/receipt/engine';
import type { OcrPayload, ScrapeResult } from '../../../convex/lib/receipt/types';

export function scrapeOffline(payload: OcrPayload): ScrapeResult {
  return sharedScrape(payload);
}
