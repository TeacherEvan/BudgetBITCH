/// <reference types="vite/client" />
import { convexTest } from 'convex-test';
import { expect, test } from 'vitest';
import { api } from './_generated/api';
import schema from './schema';

const modules = import.meta.glob('./**/*.ts');

// Partial identity — convex-test fills issuer/subject/tokenIdentifier if omitted.
// We set tokenIdentifier so our ownership checks (userId === tokenIdentifier) are meaningful.
const IDENTITY = { tokenIdentifier: 'token|user_123' };

test('creates an account scoped to the authenticated user', async () => {
  const t = convexTest(schema, modules).withIdentity(IDENTITY);
  const id = await t.mutation(api.myFunctions.createAccount, {
    name: 'Cash',
    type: 'cash',
    currency: 'USD',
  });
  expect(id).toBeTruthy();

  const accounts = await t.query(api.myFunctions.listAccounts, {});
  expect(accounts).toHaveLength(1);
  expect(accounts[0].name).toBe('Cash');
  expect(accounts[0].userId).toBe(IDENTITY.tokenIdentifier);
});

test('rejects account creation when unauthenticated', async () => {
  const t = convexTest(schema, modules);
  await expect(
    t.mutation(api.myFunctions.createAccount, {
      name: 'Cash',
      type: 'cash',
      currency: 'USD',
    }),
  ).rejects.toThrow(/Unauthenticated/);
});

test('adds a transaction and lists it for the owner', async () => {
  const t = convexTest(schema, modules).withIdentity(IDENTITY);
  const accountId = await t.mutation(api.myFunctions.createAccount, {
    name: 'Bank',
    type: 'bank',
    currency: 'USD',
  });
  await t.mutation(api.myFunctions.addTransaction, {
    accountId,
    amount: -42.5,
    description: 'Groceries',
    date: Date.now(),
  });

  const { viewer, transactions } = await t.query(
    api.myFunctions.listTransactions,
    { count: 10 },
  );
  expect(viewer).toBe(IDENTITY.tokenIdentifier);
  expect(transactions).toHaveLength(1);
  expect(transactions[0].amount).toBe(-42.5);
});

test('setBudget upserts by month + category', async () => {
  const t = convexTest(schema, modules).withIdentity(IDENTITY);
  await t.mutation(api.myFunctions.setBudget, {
    month: '2026-07',
    amount: 500,
    currency: 'USD',
  });
  // Re-setting the same month should update, not duplicate.
  await t.mutation(api.myFunctions.setBudget, {
    month: '2026-07',
    amount: 750,
    currency: 'USD',
  });

  const budgets = await t.query(api.myFunctions.listBudgets, {
    month: '2026-07',
  });
  expect(budgets).toHaveLength(1);
  expect(budgets[0].amount).toBe(750);
});
