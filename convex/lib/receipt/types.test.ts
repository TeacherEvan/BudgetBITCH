import { describe, expect, test } from 'vitest';
import { makeLine, type OcrPayload, type OcrWord } from './types';

describe('Receipt scraper types and makeLine helper', () => {
  test('makeLine clusters words by y-overlap and calculates line metadata', () => {
    const words: OcrWord[] = [
      { text: 'CHECKERS', conf: 95, bbox: [10, 20, 100, 40] },
      { text: 'HYPER', conf: 90, bbox: [110, 22, 180, 39] },
    ];

    const line = makeLine(words);

    expect(line.text).toBe('CHECKERS HYPER');
    expect(line.conf).toBe(92.5);
    expect(line.y).toBe(20);
    expect(line.words).toHaveLength(2);
  });

  test('OcrPayload structure conforms to expected schema', () => {
    const payload: OcrPayload = {
      lines: [
        {
          text: 'TOTAL R 150.00',
          conf: 88,
          y: 200,
          words: [
            { text: 'TOTAL', conf: 90, bbox: [10, 200, 60, 220] },
            { text: 'R', conf: 95, bbox: [70, 200, 80, 220] },
            { text: '150.00', conf: 84, bbox: [90, 200, 150, 220] },
          ],
        },
      ],
      width: 400,
      height: 800,
      lang: 'eng',
      engine: 'tesseract.js@6',
      capturedAt: 1700000000000,
      countryHint: 'ZA',
      currencyHint: 'ZAR',
    };

    expect(payload.engine).toBe('tesseract.js@6');
    expect(payload.lines[0].words).toHaveLength(3);
  });
});
