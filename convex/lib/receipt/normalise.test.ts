import { describe, expect, test } from 'vitest';
import { normaliseLine, normalisePayload } from './normalise';
import type { OcrPayload } from './types';

describe('OCR line normalisation', () => {
  test('folds Thai digits ๐–๙ to 0–9', () => {
    const res = normaliseLine('ยอดสุทธิ ๑๒๕.๐๐ บาท');
    expect(res.text).toBe('ยอดสุทธิ 125.00 บาท');
  });

  test('normalises multiple spaces and trims', () => {
    const res = normaliseLine('   CHECKERS   HYPER   ');
    expect(res.text).toBe('CHECKERS HYPER');
  });

  test('identifies lines with amounts', () => {
    const resAmount = normaliseLine('TOTAL R 150.50');
    expect(resAmount.hasAmount).toBe(true);

    const resNoAmount = normaliseLine('TAX INVOICE');
    expect(resNoAmount.hasAmount).toBe(false);
  });

  // Guards regression: hasAmount used a private `/\b\d+(?:[\.,]\d{2})\b/`, a
  // second and weaker definition of "this line holds money". It answered false
  // for grouped-thousands amounts, so an IDR/VND total line was flagged as
  // amount-free and skipped downstream. hasAmount now delegates to parseAmounts.
  test('flags grouped-thousands and separator-less amounts', () => {
    expect(normaliseLine('TOTAL 28,000').hasAmount).toBe(true);
    expect(normaliseLine('TOTAL 60.000').hasAmount).toBe(true);
    expect(normaliseLine('SUBTOTAL 1.234.567').hasAmount).toBe(true);
  });

  test('still rejects lines whose digits are not money', () => {
    expect(normaliseLine('TAX INVOICE').hasAmount).toBe(false);
    expect(normaliseLine('TIME 14:30').hasAmount).toBe(false);
  });

  test('normalises full payload preserving structure and adding normalised line data', () => {
    const payload: OcrPayload = {
      lines: [
        {
          text: '7-ELEVEN   SILOM  ',
          conf: 90,
          y: 10,
          words: [{ text: '7-ELEVEN', conf: 90, bbox: [0, 10, 50, 30] }],
        },
        {
          text: 'TOTAL  ฿  ๒๕.๐๐ ',
          conf: 95,
          y: 50,
          words: [{ text: 'TOTAL', conf: 95, bbox: [0, 50, 40, 70] }],
        },
      ],
      width: 300,
      height: 400,
      lang: 'tha',
      engine: 'tesseract.js@6',
      capturedAt: 1700000000000,
    };

    const norm = normalisePayload(payload);
    expect(norm.lines[0].text).toBe('7-ELEVEN SILOM');
    expect(norm.lines[1].text).toBe('TOTAL ฿ 25.00');
    expect(norm.lines[1].hasAmount).toBe(true);
  });
});
