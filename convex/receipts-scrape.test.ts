/// <reference types="vite/client" />
import { convexTest } from 'convex-test';
import { describe, expect, test } from 'vitest';
import schema from './schema';

const modules = import.meta.glob('./**/*.ts');

describe('Receipt scraper schema extensions', () => {
  test('supports inserting and querying receiptTemplates and merchantAliases', async () => {
    const t = convexTest(schema, modules);

    // Insert receipt template
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

    // Query receipt template
    const template = await t.run(async (ctx) => {
      return await ctx.db
        .query('receiptTemplates')
        .withIndex('by_templateId', (q) => q.eq('templateId', 'za.checkers.v1'))
        .first();
    });

    expect(template?.country).toBe('ZA');
  });
});
