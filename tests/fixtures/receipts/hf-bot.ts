import type { OcrPayload } from '../../../convex/lib/receipt/types';

/**
 * Captured receipt payloads emitted by the HF (Hugging Face) receipt bot
 * (TeacherBOY bridge) on every scan.
 *
 * These are used by the opt-in live contract check
 * (`tests/integration/hf-bot-ingest-live.test.ts`) to prove the deployed
 * `/receipts/ingest` route still accepts the exact shape the bot sends —
 * notably `currencyHint: null`, which the bot serializes on every scan.
 *
 * Keep `currencyHint: null` (not `undefined`/`"ZAR"`) so the contract test
 * keeps exercising the nullish() schema branch. Edit the OCR lines freely to
 * mirror real bot output, but preserve the top-level key shape.
 */

export type HfBotFixture = {
  id: string;
  payload: OcrPayload;
};

const HF_BOT_FIXTURES: HfBotFixture[] = [
  {
    id: 'hf-bot-checkers-scan',
    payload: {
      lines: [
        {
          text: 'CHECKERS HYPER BRACKENFELL',
          conf: 94,
          y: 20,
          words: [
            { text: 'CHECKERS', conf: 95, bbox: [10, 20, 100, 40] },
            { text: 'HYPER', conf: 94, bbox: [110, 20, 170, 40] },
            { text: 'BRACKENFELL', conf: 93, bbox: [180, 20, 290, 40] },
          ],
        },
        {
          text: 'DATE 15/03/2026 TIME 14:30',
          conf: 92,
          y: 70,
          words: [
            { text: 'DATE', conf: 95, bbox: [10, 70, 50, 85] },
            { text: '15/03/2026', conf: 92, bbox: [60, 70, 150, 85] },
            { text: 'TIME', conf: 92, bbox: [160, 70, 190, 85] },
            { text: '14:30', conf: 89, bbox: [200, 70, 240, 85] },
          ],
        },
        {
          text: 'FULL CREAM MILK 2L R 34.99',
          conf: 88,
          y: 100,
          words: [{ text: '34.99', conf: 86, bbox: [250, 100, 300, 115] }],
        },
        {
          text: 'BREAD WHITE 700G R 18.99',
          conf: 89,
          y: 120,
          words: [{ text: '18.99', conf: 87, bbox: [250, 120, 300, 135] }],
        },
        {
          text: 'SUBTOTAL R 53.98',
          conf: 91,
          y: 150,
          words: [{ text: '53.98', conf: 88, bbox: [250, 150, 300, 165] }],
        },
        {
          text: 'VAT 15% R 7.04',
          conf: 90,
          y: 170,
          words: [{ text: '7.04', conf: 87, bbox: [250, 170, 300, 185] }],
        },
        {
          text: 'TOTAL R 53.98',
          conf: 93,
          y: 195,
          words: [{ text: '53.98', conf: 90, bbox: [250, 195, 300, 215] }],
        },
      ],
      width: 320,
      height: 400,
      lang: 'eng',
      engine: 'tesseract.js@6',
      capturedAt: 1773585000000,
      countryHint: 'ZA',
      currencyHint: null,
    },
  },
  {
    id: 'hf-bot-familymart-scan',
    payload: {
      lines: [
        {
          text: 'FAMILYMART SUKHUMVIT 11',
          conf: 91,
          y: 18,
          words: [
            { text: 'FAMILYMART', conf: 92, bbox: [10, 18, 130, 38] },
            { text: 'SUKHUMVIT', conf: 90, bbox: [140, 18, 240, 38] },
            { text: '11', conf: 88, bbox: [250, 18, 270, 38] },
          ],
        },
        {
          text: '2026/08/01 21:14',
          conf: 89,
          y: 60,
          words: [{ text: '2026/08/01', conf: 90, bbox: [10, 60, 120, 75] }],
        },
        {
          text: 'SANDWICH SET ฿ 45.00',
          conf: 86,
          y: 110,
          words: [{ text: '45.00', conf: 84, bbox: [200, 110, 280, 125] }],
        },
        {
          text: 'COFFEE ฿ 35.00',
          conf: 87,
          y: 140,
          words: [{ text: '35.00', conf: 85, bbox: [200, 140, 280, 155] }],
        },
        {
          text: 'TOTAL ฿ 80.00',
          conf: 92,
          y: 190,
          words: [{ text: '80.00', conf: 90, bbox: [200, 190, 280, 205] }],
        },
      ],
      width: 300,
      height: 220,
      lang: 'tha',
      engine: 'tesseract.js@6',
      capturedAt: 1754068440000,
      countryHint: 'TH',
      currencyHint: null,
    },
  },
];

export async function loadHfBotFixtures(): Promise<HfBotFixture[]> {
  return HF_BOT_FIXTURES;
}
