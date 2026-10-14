import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { OcrPayload } from '../../../../convex/lib/receipt/types';

/**
 * Receipt scans captured from the Hugging Face receipt bot
 * (`huggingface.co/spaces/EvilEvan/TeacherBOY`, ReceiptAgent priority 8) over
 * real receipt photographs scraped from public datasets.
 *
 * Provenance chain per fixture:
 *   receipt photo (HF dataset, license recorded in `image`)
 *     -> vision stage using the bot's own RECEIPT_SCRAPE_PROMPT
 *     -> the bot's own `gemini_text_to_ocr_payload()` adapter
 *     -> `payload` (an OcrPayload, byte-identical to what /receipts/ingest
 *        receives in production)
 *
 * Regenerate with:
 *   node scripts/scrape-receipt-corpus.mjs --limit 4
 *   python3 scripts/capture_hf_bot_receipts.py
 *
 * `capture.visionStage.kind` states how the text was obtained:
 *   'live-vision'           — a real model call with the bot's prompt
 *   'dataset-transcription' — the dataset's human-verified transcription of the
 *                             same photo (used when live vision quota is
 *                             unavailable; keeps fixtures free + deterministic)
 */
export type HfBotVisionStage = {
  kind: 'live-vision' | 'dataset-transcription';
  detail: string;
  promptSha256: string;
  model: string | null;
  temperature?: number;
  maxOutputTokens?: number;
};

export type HfBotFixture = {
  id: string;
  capture: {
    bot: string;
    botRevision: string | null;
    agent: string;
    adapter: string;
    visionStage: HfBotVisionStage;
  };
  image: {
    sha256: string;
    bytes: number;
    dataset: string;
    config: string;
    split: string;
    rowIdx: number;
    license: string;
    homepage: string;
    note: string;
  };
  /** Values published with the source dataset row; independent of our scraper. */
  datasetGroundTruth: {
    totalRaw?: string | null;
    subtotalRaw?: string | null;
    taxRaw?: string | null;
    dateRaw?: string | null;
    sellerRaw?: string | null;
    imageSize?: { width: number; height: number } | null;
  };
  rawText: string;
  payload: OcrPayload;
};

const FIXTURE_DIR = path.join(process.cwd(), 'tests', 'fixtures', 'receipts', 'hf-bot');

export function loadHfBotFixtures(): HfBotFixture[] {
  return readdirSync(FIXTURE_DIR)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => JSON.parse(readFileSync(path.join(FIXTURE_DIR, name), 'utf8')) as HfBotFixture);
}

export function loadHfBotFixture(id: string): HfBotFixture {
  const found = loadHfBotFixtures().find((f) => f.id === id);
  if (!found) throw new Error(`No HF bot fixture with id "${id}"`);
  return found;
}

/**
 * Parse a dataset ground-truth amount string ("28,000", "60.000", "$ 889,20")
 * into a number. Deliberately independent of the app's own amount parser so a
 * bug there cannot make an assertion pass by agreeing with itself.
 */
export function parseGroundTruthAmount(raw: string): number {
  const cleaned = raw.replace(/[^\d.,-]/g, '').trim();
  const hasDecimalTail = /[.,]\d{2}$/.test(cleaned);
  if (!hasDecimalTail) return Number(cleaned.replace(/[.,]/g, ''));
  const sep = cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.') ? ',' : '.';
  const [intPart, decPart] = cleaned.split(sep === ',' ? /,(?=\d{2}$)/ : /\.(?=\d{2}$)/);
  return Number(`${intPart.replace(/[.,]/g, '')}.${decPart}`);
}
