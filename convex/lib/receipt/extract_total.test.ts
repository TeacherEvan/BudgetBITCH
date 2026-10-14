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

/** Build a minimal normalised payload from bare line text, top to bottom. */
function payloadFromLines(texts: string[]) {
  return normalisePayload({
    lines: texts.map((text, i) => ({ text, conf: 90, y: (i + 1) * 20, words: [] })),
    width: 600,
    height: 1000,
    lang: 'eng',
    engine: 'tesseract.js@6',
    capturedAt: 1_700_000_000_000,
  });
}

// Guards regression for the shipped extract_total.ts fix: DISC / TOTAL ITEMS /
// QTY negative anchors, the `firstPositive()` filter on every anchored read, and
// the `parseBareIntegerAmounts()` fallback for separator-less totals. Before
// that fix `TOTAL DISC -60.000` was banked as the amount owed, `TOTAL ITEMS 3`
// was banked as a 3-unit total, and `TOTAL 91000` extracted as null.
describe('Total extractor rejects non-money TOTAL lines and reads bare integers', () => {
  test('never returns a discount line as the total', () => {
    const res = extractTotal(payloadFromLines([
      'TOKO MAJU JAYA',
      'NASI GORENG 60.000',
      'TOTAL DISC -60.000',
      'TOTAL 91.000',
    ]));

    expect(res?.value).toBe(91000);
    expect(res?.evidenceLine?.text).toBe('TOTAL 91.000');
  });

  test('never returns a unit count from a TOTAL ITEMS line as the total', () => {
    const res = extractTotal(payloadFromLines([
      'SHOP RECEIPT',
      'TOTAL ITEMS 3',
      'TOTAL 45.60',
    ]));

    expect(res?.value).toBe(45.6);
  });

  test('never returns a QTY line as the total', () => {
    const res = extractTotal(payloadFromLines([
      'SHOP RECEIPT',
      'QTY 4 TOTAL LINES',
      'TOTAL 45.60',
    ]));

    expect(res?.value).toBe(45.6);
  });

  test('reads a separator-less total on an anchored line', () => {
    const res = extractTotal(payloadFromLines([
      'WARUNG SEDERHANA',
      'AYAM BAKAR',
      'TOTAL 91000',
    ]));

    expect(res?.value).toBe(91000);
    expect(res?.ruleId).toBe('anchor-same-line');
  });

  test('reads grouped thousands on an anchored line at full value', () => {
    const res = extractTotal(payloadFromLines([
      'MINIMARKET',
      'TOTAL 28,000',
    ]));

    expect(res?.value).toBe(28000);
  });

  test('takes the rightmost positive amount on an anchored line', () => {
    const res = extractTotal(payloadFromLines([
      'GRAND TOTAL 2 x 45.00 90.00',
    ]));

    expect(res?.value).toBe(90.0);
  });

  test('raises no total rather than a negative one on a full refund slip', () => {
    // Guards regression for the same-class hardening of the subtotal+tax
    // fallback: a refund's `SUBTOTAL 150.00-` / `VAT 22.50-` summed to -172.50
    // and reached the draft as money owed. A null total raises a question
    // instead, which is the only acceptable outcome for an unreadable amount.
    const res = extractTotal(payloadFromLines([
      'REFUND SLIP',
      'ITEM RETURNED',
      'SUBTOTAL 150.00-',
      'VAT 22.50-',
    ]));

    expect(res).toBeNull();
  });

  test('still sums subtotal + a zero-rated VAT line', () => {
    const res = extractTotal(payloadFromLines([
      'ZERO RATED GOODS',
      'SUBTOTAL 100.00',
      'VAT 0.00',
    ]));

    expect(res?.value).toBe(100.0);
    expect(res?.ruleId).toBe('subtotal-tax-sum');
  });
});
