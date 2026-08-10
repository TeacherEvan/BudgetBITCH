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
    expect(result.fields.total?.value).toBe(53.98);

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
});
