import { describe, expect, test } from 'vitest';
import { loadAllFixtures } from '../../../tests/fixtures/receipts';
import { extractTotal } from './extract_total';
import { normalisePayload } from './normalise';

describe('Total extractor with anchor and geometry rules', () => {
  test('extracts correct total for standard ZA receipt', async () => {
    const fixtures = await loadAllFixtures();
    const checkers = fixtures.find((f) => f.id === 'za-checkers-basic')!;
    const norm = normalisePayload(checkers.payload);

    const res = extractTotal(norm);
    expect(res).toBeDefined();
    expect(res?.value).toBe(5398); // 53.98 * 100 = 5398 minor units
  });

  test('extracts correct total for TH receipt', async () => {
    const fixtures = await loadAllFixtures();
    const seven = fixtures.find((f) => f.id === 'th-7eleven-basic')!;
    const norm = normalisePayload(seven.payload);

    const res = extractTotal(norm);
    expect(res).toBeDefined();
    expect(res?.value).toBe(2600); // 26.0 * 100 = 2600 minor units
  });

  test('ignores TOTAL SAVINGS and extracts real TOTAL', async () => {
    const fixtures = await loadAllFixtures();
    const trap = fixtures.find((f) => f.id === 'adv-savings-trap')!;
    const norm = normalisePayload(trap.payload);

    const res = extractTotal(norm);
    expect(res).toBeDefined();
    expect(res?.value).toBe(34000); // 340.0 * 100 = 34000 minor units
  });

  test('falls back gracefully when TOTAL line is missing but subtotal+vat exist', async () => {
    const fixtures = await loadAllFixtures();
    const subtotalOnly = fixtures.find((f) => f.id === 'adv-subtotal-only')!;
    const norm = normalisePayload(subtotalOnly.payload);

    const res = extractTotal(norm);
    expect(res).toBeDefined();
    expect(res?.value).toBe(17250); // 172.5 * 100 = 17250 minor units
  });
});
