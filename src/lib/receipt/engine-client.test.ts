import { describe, expect, test } from 'vitest';
import { scrapeOffline } from './engine-client';

describe('scrapeOffline', () => {
  test('normalizes minor units (cents/satang) to major currency units for total, tax, and line items', () => {
    const result = scrapeOffline({
      lines: [
        { text: 'COFFEE SHOP', conf: 95, y: 10, words: [] },
        { text: 'LATTE 15.00', conf: 90, y: 20, words: [] },
        { text: 'MUFFIN 8.50', conf: 90, y: 30, words: [] },
        { text: 'TAX 1.88', conf: 90, y: 40, words: [] },
        { text: 'TOTAL 25.38', conf: 95, y: 50, words: [] },
      ],
      width: 400,
      height: 600,
      lang: 'eng',
      engine: 'tesseract.js@6',
      capturedAt: Date.now(),
      countryHint: 'US',
      currencyHint: 'USD',
    });

    // Engine extracts 2538 minor units -> scrapeOffline normalizes to 25.38 major units
    expect(result.fields.total?.value).toBe(25.38);
    expect(result.fields.tax?.value).toBe(1.88);
    expect(result.lineItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ description: 'LATTE', amount: 15.0 }),
        expect.objectContaining({ description: 'MUFFIN', amount: 8.5 }),
      ]),
    );
  });
});
