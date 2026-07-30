import { describe, expect, test } from 'vitest';
import { loadAllFixtures } from '../../../tests/fixtures/receipts';
import { scrape } from './engine';

describe('Scraper engine entrypoint', () => {
  test('scrapes ZA Checkers fixture and produces complete ScrapeResult', async () => {
    const fixtures = await loadAllFixtures();
    const checkers = fixtures.find((f) => f.id === 'za-checkers-basic')!;

    const result = scrape(checkers.payload, { now: Date.parse('2026-03-31T00:00:00Z') });

    expect(result).toBeDefined();
    expect(result.fields.total?.value).toBe(53.98);
    expect(result.fields.date?.value).toBe('2026-03-15');
    expect(result.fields.merchant?.value).toBe('CHECKERS HYPER BRACKENFELL');
    expect(result.fields.currency?.value).toBe('ZAR');
    expect(result.confidence.total).toBeGreaterThanOrEqual(0.85);
  });

  test('is deterministic: identical input yields byte-identical result', async () => {
    const fixtures = await loadAllFixtures();
    const seven = fixtures.find((f) => f.id === 'th-7eleven-basic')!;
    const now = Date.parse('2026-03-31T00:00:00Z');

    const res1 = scrape(seven.payload, { now });
    const res2 = scrape(seven.payload, { now });

    expect(JSON.stringify(res1)).toBe(JSON.stringify(res2));
  });
});
