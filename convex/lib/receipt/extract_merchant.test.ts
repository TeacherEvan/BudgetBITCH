import { describe, expect, test } from 'vitest';
import { loadAllFixtures } from '../../../tests/fixtures/receipts';
import { extractMerchant } from './extract_merchant';
import { normalisePayload } from './normalise';

describe('Merchant extractor', () => {
  test('extracts Checkers merchant from top line', async () => {
    const fixtures = await loadAllFixtures();
    const checkers = fixtures.find((f) => f.id === 'za-checkers-basic')!;
    const norm = normalisePayload(checkers.payload);

    const res = extractMerchant(norm);
    expect(res).toBeDefined();
    expect(res?.value).toBe('CHECKERS HYPER BRACKENFELL');
  });

  test('skips header noise like TAX INVOICE', async () => {
    const fixtures = await loadAllFixtures();
    const seven = fixtures.find((f) => f.id === 'th-7eleven-basic')!;
    const norm = normalisePayload(seven.payload);

    const res = extractMerchant(norm);
    expect(res).toBeDefined();
    expect(res?.value).toBe('7-ELEVEN SILOM ROAD');
  });
});
