// convex/feedback.test.ts
/// <reference types="vite/client" />
import { describe, it, expect } from 'vitest';
import { convexTest } from 'convex-test';
import { api } from './_generated/api';
import schema from './schema';

const modules = import.meta.glob('./**/*.ts');

describe('feedback.report', () => {
  it('persists a bug report and returns an id', async () => {
    const t = convexTest(schema, modules);
    const res = await t.mutation(api.feedback.report, {
      type: 'bug',
      message: 'App crashes on receipt scan',
      email: 'user@example.com',
      locale: 'en-ZA',
    });
    expect(res.reportId).toBeDefined();

    const stored = await t.query(api.feedback.getRecent, { limit: 1 });
    expect(stored[0].type).toBe('bug');
    expect(stored[0].message).toBe('App crashes on receipt scan');
    expect(stored[0].email).toBe('user@example.com');
  });

  it('persists a feedback report without email', async () => {
    const t = convexTest(schema, modules);
    const res = await t.mutation(api.feedback.report, {
      type: 'feedback',
      message: 'Love the app!',
    });
    const stored = await t.query(api.feedback.getRecent, { limit: 1 });
    expect(stored[0].type).toBe('feedback');
    expect(stored[0].email).toBeUndefined();
    expect(res.reportId).toBeDefined();
  });
});
