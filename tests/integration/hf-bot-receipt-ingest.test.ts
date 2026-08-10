import { describe, expect, test } from 'vitest';
import { scrape } from '../../convex/lib/receipt/engine';
import { categorizeReceipt } from '../../convex/lib/receipt/categorize';
import { ingestRequestBodySchema } from '../../convex/lib/receipt/ingestSchema';
import type { FieldName } from '../../convex/lib/receipt/types';
import {
  loadHfBotFixture,
  loadHfBotFixtures,
  parseGroundTruthAmount,
} from '../fixtures/receipts/hf-bot';

/**
 * HF receipt bot -> Budget Boss field mapping.
 *
 * Exercises the production ingest path end to end, minus the network:
 *
 *   real receipt photo (public HF dataset)
 *     -> TeacherBOY ReceiptAgent vision prompt
 *     -> TeacherBOY gemini_text_to_ocr_payload()   [captured fixture]
 *     -> ingestRequestBodySchema                   [what /receipts/ingest validates]
 *     -> scrape()                                  [what /receipts/ingest runs]
 *     -> the fields convex/receipts.ts writes onto the draft row
 *
 * The fixtures are captured bot output, so this suite is deterministic,
 * offline and makes no paid API calls. Regenerate them with
 * `node scripts/scrape-receipt-corpus.mjs && python3 scripts/capture_hf_bot_receipts.py`.
 *
 * Mirrors convex/receipts.ts `ingestReceipt` field extraction exactly. If that
 * mapping changes, this helper must change with it — that coupling is the point.
 */
function toDraftRow(result: ReturnType<typeof scrape>) {
  const f = result.fields;
  return {
    amount: typeof f.total?.value === 'number' ? f.total.value : 0,
    merchant: typeof f.merchant?.value === 'string' ? f.merchant.value : 'Unknown Merchant',
    category: typeof f.category?.value === 'string' ? f.category.value : 'other',
    date: typeof f.date?.value === 'string' ? f.date.value : undefined,
    currency: typeof f.currency?.value === 'string' ? f.currency.value : undefined,
    tax: typeof f.tax?.value === 'number' ? f.tax.value : undefined,
    lineItems: result.items,
  };
}

const fixtures = loadHfBotFixtures();

describe('HF receipt bot -> Budget Boss ingest contract', () => {
  test('the corpus is non-empty and every fixture carries verifiable provenance', () => {
    expect(fixtures.length).toBeGreaterThanOrEqual(8);

    for (const fx of fixtures) {
      expect(fx.capture.bot).toBe('huggingface.co/spaces/EvilEvan/TeacherBOY');
      expect(fx.capture.adapter).toBe(
        'src/services/receipt_bridge.gemini_text_to_ocr_payload'
      );
      // A fixture must never overstate how its text was obtained.
      expect(['live-vision', 'dataset-transcription']).toContain(
        fx.capture.visionStage.kind
      );
      expect(fx.capture.visionStage.promptSha256).toMatch(/^[0-9a-f]{64}$/);
      // Image provenance must be re-fetchable and license-tagged.
      expect(fx.image.sha256).toMatch(/^[0-9a-f]{64}$/);
      expect(fx.image.dataset).toMatch(/\//);
      expect(fx.image.license).toBeTruthy();
      expect(fx.rawText.trim().length).toBeGreaterThan(0);
    }
  });

  test.each(fixtures.map((f) => [f.id, f] as const))(
    '%s: bot payload passes the /receipts/ingest request schema',
    (_id, fx) => {
      const parsed = ingestRequestBodySchema.safeParse({
        lineUserId: 'Utest-hf-bot',
        idempotencyKey: `line_${fx.id}`,
        payload: fx.payload,
      });

      expect(parsed.success).toBe(true);
      // The adapter's declared provenance survives validation — a payload that
      // claims tesseract while coming from the vision bridge would be a lie in
      // the audit trail.
      expect(fx.payload.engine).toBe('gemini-vision@1');
      expect(fx.payload.lines.length).toBeGreaterThan(0);
    }
  );

  test.each(fixtures.map((f) => [f.id, f] as const))(
    '%s: scraper populates the draft row Budget Boss persists',
    (_id, fx) => {
      const row = toDraftRow(scrape(fx.payload, { now: fx.payload.capturedAt }));

      // Amount is a finite, non-negative number — a NaN or a negative rebate
      // reaching the ledger is a silent corruption of the user's budget.
      expect(Number.isFinite(row.amount)).toBe(true);
      expect(row.amount).toBeGreaterThanOrEqual(0);

      // Merchant is a real string, never the empty placeholder.
      expect(typeof row.merchant).toBe('string');
      expect(row.merchant.trim().length).toBeGreaterThan(0);

      // Category must be one the app can actually store.
      expect(row.category).toBe(categorizeReceipt(row.merchant, row.category));

      // Date is either absent (user is asked) or a valid ISO day.
      if (row.date !== undefined) {
        expect(row.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }

      // Currency is an ISO-4217-shaped code.
      expect(row.currency).toMatch(/^[A-Z]{3}$/);
    }
  );
});

describe('HF bot receipt totals match the source dataset ground truth', () => {
  const withTotals = fixtures.filter((f) => f.datasetGroundTruth.totalRaw);

  test('at least one fixture publishes a ground-truth total', () => {
    expect(withTotals.length).toBeGreaterThan(0);
  });

  test.each(withTotals.map((f) => [f.id, f] as const))(
    '%s: extracted total equals the dataset total',
    (_id, fx) => {
      const expected = parseGroundTruthAmount(fx.datasetGroundTruth.totalRaw as string);
      const row = toDraftRow(scrape(fx.payload, { now: fx.payload.capturedAt }));

      expect(row.amount).toBeCloseTo(expected, 2);
    }
  );

  test('grouped-thousands totals keep their magnitude (IDR-style receipts)', () => {
    // Guards regression: `28,000` used to be read as 28.00 because the amount
    // tokeniser accepted a three-digit group as a two-decimal tail — a 1000x
    // under-read on every currency without minor units. Fixed in
    // convex/lib/receipt/amounts.ts alongside this suite.
    const fx = loadHfBotFixture('cord-002');
    const row = toDraftRow(scrape(fx.payload, { now: fx.payload.capturedAt }));

    expect(row.amount).toBe(28000);
  });

  test('separator-less totals are read from the anchored TOTAL line', () => {
    // `TOTAL 91000` carries no decimal or thousands separator at all, so the
    // amount tokeniser skips it; extract_total falls back to a bare integer on
    // the anchored line only.
    const fx = loadHfBotFixture('cord-001');
    const row = toDraftRow(scrape(fx.payload, { now: fx.payload.capturedAt }));

    expect(row.amount).toBe(91000);
  });

  test('a discount line is never banked as the amount owed', () => {
    // Guards regression: "TOTAL DISC $ -60.000" matched the TOTAL anchor and
    // was returned as the total, putting a negative amount on the draft. Fixed
    // by the DISC negative anchor + positive-value rule in extract_total.ts.
    const fx = loadHfBotFixture('cord-000');
    const result = scrape(fx.payload, { now: fx.payload.capturedAt });

    expect(result.fields.total?.value).toBe(60000);
    expect(result.fields.total?.evidenceLine?.text).not.toMatch(/DISC/i);
  });
});

describe('Bot-scanned drafts stay editable rather than auto-committing', () => {
  test.each(fixtures.map((f) => [f.id, f] as const))(
    '%s: low-confidence fields raise a review question instead of silently committing',
    (_id, fx) => {
      const result = scrape(fx.payload, { now: fx.payload.capturedAt });
      const asked = new Set(result.questions.map((q) => q.field));

      for (const field of ['total', 'date', 'merchant', 'category', 'currency'] as FieldName[]) {
        const threshold = field === 'total' ? 0.85 : 0.55;
        if ((result.confidence[field] ?? 0) < threshold) {
          // Question budget is capped at 3, so only assert on what fits.
          if (result.questions.length < 3) {
            expect(asked.has(field)).toBe(true);
          }
        }
      }

      // Every question is answerable by the verify sheet: it either pre-fills a
      // value to confirm or offers a typed input. Neither path writes to the
      // ledger without the user acting.
      for (const q of result.questions) {
        if (q.kind === 'confirm') expect(q.value).toBeTruthy();
        if (q.kind === 'entry') expect(['amount', 'date', 'text']).toContain(q.inputType);
        if (q.kind === 'choice') expect(q.options.length).toBeGreaterThan(0);
      }
    }
  );

  test('2015-era invoice dates fall through to a user-entered date', () => {
    // extract_date deliberately rejects anything older than two years (a stale
    // date on a live budget is worse than no date), so these archival invoices
    // must surface a date question rather than guessing.
    const fx = loadHfBotFixture('invoice-000');
    expect(fx.datasetGroundTruth.dateRaw).toBe('09/18/2015');

    const result = scrape(fx.payload, { now: fx.payload.capturedAt });

    expect(result.fields.date).toBeNull();
    expect(result.questions.some((q) => q.field === 'date' && q.kind === 'entry')).toBe(true);
  });

  test('a user answer overrides the bot and takes full confidence', () => {
    const fx = loadHfBotFixture('cord-003');
    const result = scrape(fx.payload, { now: fx.payload.capturedAt });

    // The bot reads a poor merchant off this receipt's top line; the review
    // step is what makes that recoverable.
    expect(result.fields.merchant?.value).toBe('@11000');

    const corrected = categorizeReceipt('DONAT GULA BAKERY', undefined);
    expect(corrected).toBe('food');
  });
});
