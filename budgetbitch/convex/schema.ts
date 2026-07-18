import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

// BudgetBITCH data model.
// Ownership is always scoped by `userId` (the Convex auth tokenIdentifier),
// never by a client-supplied id. High-churn ledger data (transactions) lives
// in its own table with one document per row rather than an unbounded array.
export default defineSchema({
  accounts: defineTable({
    userId: v.string(),
    name: v.string(),
    type: v.union(
      v.literal('bank'),
      v.literal('cash'),
      v.literal('card'),
      v.literal('wallet'),
    ),
    currency: v.string(),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index('by_userId', ['userId'])
    .index('by_userId_and_isActive', ['userId', 'isActive']),

  categories: defineTable({
    userId: v.string(),
    name: v.string(),
    kind: v.union(v.literal('income'), v.literal('expense')),
    color: v.string(),
    icon: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index('by_userId', ['userId'])
    .index('by_userId_and_kind', ['userId', 'kind']),

  transactions: defineTable({
    userId: v.string(),
    accountId: v.id('accounts'),
    categoryId: v.optional(v.id('categories')),
    // Signed amount: negative = expense, positive = income.
    amount: v.number(),
    description: v.string(),
    date: v.number(), // epoch ms
    createdAt: v.number(),
  })
    .index('by_userId', ['userId'])
    .index('by_userId_and_date', ['userId', 'date'])
    .index('by_userId_and_accountId', ['userId', 'accountId'])
    .index('by_userId_and_categoryId', ['userId', 'categoryId']),

  budgets: defineTable({
    userId: v.string(),
    month: v.string(), // 'YYYY-MM'
    categoryId: v.optional(v.id('categories')), // omitted = overall budget
    amount: v.number(),
    currency: v.string(),
    createdAt: v.number(),
  })
    .index('by_userId', ['userId'])
    .index('by_userId_and_month', ['userId', 'month'])
    .index('by_userId_and_month_and_categoryId', [
      'userId',
      'month',
      'categoryId',
    ]),
});
