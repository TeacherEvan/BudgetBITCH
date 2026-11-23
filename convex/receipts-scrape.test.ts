/// <reference types="vite/client" />
import { convexTest } from 'convex-test';
import { describe, expect, test } from 'vitest';
import { api } from './_generated/api';
import schema from './schema';

const modules = import.meta.glob('./**/*.ts');

describe('Receipt scraper backend API', () => {
  test('supports inserting and querying receiptTemplates and merchantAliases', async () => {
    const t = convexTest(schema, modules);

    const templateId = await t.run(async (ctx) => {
      return await ctx.db.insert('receiptTemplates', {
        templateId: 'za.checkers.v1',
        version: '1.0',
        country: 'ZA',
        fingerprint: ['CHECKERS'],
        fields: {},
        currency: 'ZAR',
        vatRate: 0.15,
        enabled: true,
        updatedAt: Date.now(),
      });
    });

    expect(templateId).toBeDefined();

    const template = await t.run(async (ctx) => {
      return await ctx.db
        .query('receiptTemplates')
        .withIndex('by_templateId', (q) => q.eq('templateId', 'za.checkers.v1'))
        .first();
    });

    expect(template?.country).toBe('ZA');
  });

  test('receipts.scrape mutation requires auth and creates a draft receipt', async () => {
    const t = convexTest(schema, modules);

    // Unauthenticated call should fail
    await expect(
      t.mutation(api.receipts.scrape, {
        payload: {
          lines: [
            {
              text: 'CHECKERS HYPER 53.98',
              conf: 90,
              y: 10,
              words: [],
            },
          ],
          width: 300,
          height: 400,
          lang: 'eng',
          engine: 'tesseract.js@6',
          capturedAt: Date.now(),
        },
      })
    ).rejects.toThrow('Authentication required');

    // Authenticated user
    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert('users', { name: 'Alice' });
    });
    const authedT = t.withIdentity({ subject: userId });

    const result = await authedT.mutation(api.receipts.scrape, {
      payload: {
        lines: [
          {
            text: 'CHECKERS HYPER BRACKENFELL',
            conf: 95,
            y: 10,
            words: [],
          },
          {
            text: 'TOTAL R 53.98',
            conf: 90,
            y: 50,
            words: [],
          },
        ],
        width: 300,
        height: 400,
        lang: 'eng',
        engine: 'tesseract.js@6',
        capturedAt: Date.now(),
      },
    });

    expect(result.draftId).toBeDefined();
    expect(result.fields.total?.value).toBe(53.98); // Converted from 5398 minor units to 53.98 major units

    // Verify persisted draft row
    const draftRow = await authedT.run(async (ctx) => {
      return await ctx.db.get(result.draftId);
    });

    expect(draftRow?.status).toBe('draft');
    expect(draftRow?.engine).toBe('scraper-bot');
  });

  test('receipts.answer mutation updates draft and folds answers', async () => {
    const t = convexTest(schema, modules);
    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert('users', { name: 'Bob' });
    });
    const authedT = t.withIdentity({ subject: userId });

    const scraped = await authedT.mutation(api.receipts.scrape, {
      payload: {
        lines: [{ text: 'UNKNOWN 100.00', conf: 50, y: 10, words: [] }],
        width: 300,
        height: 400,
        lang: 'eng',
        engine: 'tesseract.js@6',
        capturedAt: Date.now(),
      },
    });

    const answered = await authedT.mutation(api.receipts.answer, {
      draftId: scraped.draftId,
      answers: { merchant: 'SUPERSPAR' },
    });

    expect(answered.fields.merchant?.value).toBe('SUPERSPAR');
    expect(answered.confidence.merchant).toBe(1.0);
  });

  test('receipts.confirm promotes draft to confirmed and learns merchant alias', async () => {
    const t = convexTest(schema, modules);
    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert('users', { name: 'Charlie' });
    });
    const authedT = t.withIdentity({ subject: userId });

    const scraped = await authedT.mutation(api.receipts.scrape, {
      payload: {
        lines: [{ text: 'CHECKERS 50.00', conf: 90, y: 10, words: [] }],
        width: 300,
        height: 400,
        lang: 'eng',
        engine: 'tesseract.js@6',
        capturedAt: Date.now(),
      },
    });

    await authedT.mutation(api.receipts.confirm, {
      draftId: scraped.draftId,
    });

    // Check confirmed status
    const confirmedRow = await authedT.run(async (ctx) => {
      return await ctx.db.get(scraped.draftId);
    });
    expect(confirmedRow?.status).toBe('confirmed');

    // Check alias created
    const alias = await authedT.run(async (ctx) => {
      return await ctx.db
        .query('merchantAliases')
        .withIndex('by_user_and_normalised', (q) => q.eq('userId', userId).eq('normalised', 'checkers 50.00'))
        .first();
    });
    expect(alias).toBeDefined();
  });

  test('receipts.syncOfflineDraft is idempotent by clientDraftId (no duplicate on retry)', async () => {
    const t = convexTest(schema, modules);
    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert('users', { name: 'Dave' });
    });
    const authedT = t.withIdentity({ subject: userId });

    const args = {
      clientDraftId: 'draft-123',
      payload: {
        lines: [{ text: 'PICK N PAY 120.50', conf: 90, y: 10, words: [] }],
        width: 300,
        height: 400,
        lang: 'eng',
        engine: 'tesseract.js@6',
        capturedAt: Date.now(),
      },
    };

    const first = await authedT.mutation(api.receipts.syncOfflineDraft, args);
    expect(first.alreadySynced).toBe(false);

    const second = await authedT.mutation(api.receipts.syncOfflineDraft, args);
    expect(second.alreadySynced).toBe(true);
    expect(second.receiptId).toBe(first.receiptId);

    const rows = await authedT.run(async (ctx) => {
      return await ctx.db
        .query('receipts')
        .withIndex('by_user_and_clientDraftId', (q) => q.eq('userId', userId).eq('clientDraftId', 'draft-123'))
        .collect();
    });
    expect(rows).toHaveLength(1);
  });

  // P1-C3 regression guards: answers must reconstruct stored fields from the
  // receipt's real columns, and confirm must persist corrected columns.
  test('answer preserves previously extracted amount/tax/currency/category columns', async () => {
    const t = convexTest(schema, modules);
    const userId = await t.run(async (ctx) => ctx.db.insert('users', { name: 'Fields' }));
    const authedT = t.withIdentity({ subject: userId });

    const draftId = await authedT.run(async (ctx) =>
      ctx.db.insert('receipts', {
        userId,
        amount: 53.98,
        merchant: 'CHECKERS',
        category: 'food',
        date: '2026-01-15',
        tax: 7.03,
        currency: 'ZAR',
        parsedAt: Date.now(),
        geminiModel: 'scraper-bot',
        imageMimeType: 'application/json',
        imageSizeBytes: 0,
        status: 'draft',
        engine: 'scraper-bot',
      } as any),
    );

    const answered = await authedT.mutation(api.receipts.answer, {
      draftId,
      answers: { merchant: 'SUPERSPAR' },
    });

    // The returned field/confidence map must reconstruct the *stored* columns,
    // not an empty object that makes every other field look unextracted.
    expect(answered.fields.total?.value).toBe(53.98);
    expect(answered.fields.tax?.value).toBe(7.03);
    expect(answered.fields.currency?.value).toBe('ZAR');
    expect(answered.confidence.total).toBe(1);

    const row = await authedT.run(async (ctx: any) => ctx.db.get(draftId));
    expect(row.merchant).toBe('SUPERSPAR');
    expect(row.amount).toBe(53.98);
    expect(row.tax).toBe(7.03);
    expect(row.currency).toBe('ZAR');
    expect(row.category).toBe('food');
    expect(row.date).toBe('2026-01-15');
  });

  test('confirm persists corrected amount/merchant/category/date/tax/currency/lineItems', async () => {
    const t = convexTest(schema, modules);
    const userId = await t.run(async (ctx) => ctx.db.insert('users', { name: 'Confirm' }));
    const authedT = t.withIdentity({ subject: userId });

    const draftId = await authedT.run(async (ctx) =>
      ctx.db.insert('receipts', {
        userId,
        amount: 10,
        merchant: 'OLD SHOP',
        category: 'other',
        parsedAt: Date.now(),
        geminiModel: 'scraper-bot',
        imageMimeType: 'application/json',
        imageSizeBytes: 0,
        status: 'draft',
        engine: 'scraper-bot',
      } as any),
    );

    await authedT.mutation(api.receipts.confirm, {
      draftId,
      overrides: {
        amount: 75.5,
        merchant: 'NEW SHOP',
        category: 'food',
        date: '2026-02-02',
        tax: 5,
        currency: 'ZAR',
        lineItems: [{ description: 'Bread', amount: 75.5 }],
      },
    });

    const row: any = await authedT.run(async (ctx: any) => ctx.db.get(draftId));
    expect(row.status).toBe('confirmed');
    expect(row.amount).toBe(75.5);
    expect(row.merchant).toBe('NEW SHOP');
    expect(row.category).toBe('food');
    expect(row.date).toBe('2026-02-02');
    expect(row.tax).toBe(5);
    expect(row.currency).toBe('ZAR');
    expect(row.lineItems).toEqual([{ description: 'Bread', amount: 75.5 }]);
    expect(row.corrections.merchant).toBe('NEW SHOP');
  });

  // P2-N2 regression guard.
  test('syncOfflineDraft replay applies answers and confirmed instead of short-circuiting', async () => {
    const t = convexTest(schema, modules);
    const userId = await t.run(async (ctx) => ctx.db.insert('users', { name: 'Replay' }));
    const authedT = t.withIdentity({ subject: userId });
    const payload = {
      lines: [{ text: 'SHOP 12.50', conf: 90, y: 10, words: [] }],
      width: 300,
      height: 400,
      lang: 'eng',
      engine: 'tesseract.js@6',
      capturedAt: Date.now(),
    };

    const first = await authedT.mutation(api.receipts.syncOfflineDraft, {
      clientDraftId: 'replay-1',
      payload,
    });
    expect(first.alreadySynced).toBe(false);

    const replay = await authedT.mutation(api.receipts.syncOfflineDraft, {
      clientDraftId: 'replay-1',
      payload,
      answers: { merchant: 'LATE EDIT', total: '0' },
      confirmed: true,
    });

    expect(replay.receiptId).toBe(first.receiptId);
    expect(replay.alreadySynced).toBe(false); // a mutation actually occurred

    const row: any = await authedT.run(async (ctx: any) => ctx.db.get(first.receiptId));
    expect(row.status).toBe('confirmed');
    expect(row.merchant).toBe('LATE EDIT');
    expect(row.amount).toBe(0); // "0" parsed as a number, not left as a string
  });
});
