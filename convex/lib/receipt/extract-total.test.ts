import { describe, expect, test } from 'vitest';
import { loadAllFixtures } from '../../../tests/fixtures/receipts';
import { extractTotal } from './extract-total';
import { normalisePayload } from './normalise';

describe('Total extractor with anchor and geometry rules', () => {
  test('extracts correct total for standard ZA receipt', async () => {
    const fixtures = await loadAllFixtures();
    const checkers = fixtures.find((f) => f.id === 'za-checkers-basic')!;
    const norm = normalisePayload(checkers.payload);

    const res = extractTotal(norm);
    expect(res).toBeDefined();
    expect(res?.value).toBe(53.98);
  });

  test('extracts correct total for TH receipt', async () => {
    const fixtures = await loadAllFixtures();
    const seven = fixtures.find((f) => f.id === 'th-7eleven-basic')!;
    const norm = normalisePayload(seven.payload);

    const res = extractTotal(norm);
    expect(res).toBeDefined();
    expect(res?.value).toBe(26.0);
  });

  test('ignores TOTAL SAVINGS and extracts real TOTAL', async () => {
    const fixtures = await loadAllFixtures();
    const trap = fixtures.find((f) => f.id === 'adv-savings-trap')!;
    const norm = normalisePayload(trap.payload);

    const res = extractTotal(norm);
    expect(res).toBeDefined();
    expect(res?.value).toBe(340.0);
  });

  test('falls back gracefully when TOTAL line is missing but subtotal+vat exist', async () => {
    const fixtures = await loadAllFixtures();
    const subtotalOnly = fixtures.find((f) => f.id === 'adv-subtotal-only')!;
    const norm = normalisePayload(subtotalOnly.payload);

    const res = extractTotal(norm);
    expect(res).toBeDefined();
    expect(res?.value).toBe(172.5);
  });
});
