import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

const ACCOUNT_TYPES = v.union(
  v.literal('bank'),
  v.literal('cash'),
  v.literal('card'),
  v.literal('wallet'),
);

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

export const createAccount = mutation({
  args: {
    name: v.string(),
    type: ACCOUNT_TYPES,
    currency: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthenticated');
    const userId = identity.tokenIdentifier;
    return await ctx.db.insert('accounts', {
      userId,
      name: args.name,
      type: args.type,
      currency: args.currency,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

export const listAccounts = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    return await ctx.db
      .query('accounts')
      .withIndex('by_userId', (q) => q.eq('userId', identity.tokenIdentifier))
      .collect();
  },
});

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export const createCategory = mutation({
  args: {
    name: v.string(),
    kind: v.union(v.literal('income'), v.literal('expense')),
    color: v.string(),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthenticated');
    const userId = identity.tokenIdentifier;
    return await ctx.db.insert('categories', {
      userId,
      name: args.name,
      kind: args.kind,
      color: args.color,
      icon: args.icon,
      createdAt: Date.now(),
    });
  },
});

export const listCategories = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    return await ctx.db
      .query('categories')
      .withIndex('by_userId', (q) => q.eq('userId', identity.tokenIdentifier))
      .collect();
  },
});

// ---------------------------------------------------------------------------
// Transactions
// ---------------------------------------------------------------------------

export const addTransaction = mutation({
  args: {
    accountId: v.id('accounts'),
    categoryId: v.optional(v.id('categories')),
    amount: v.number(),
    description: v.string(),
    date: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthenticated');
    const userId = identity.tokenIdentifier;
    return await ctx.db.insert('transactions', {
      userId,
      accountId: args.accountId,
      categoryId: args.categoryId,
      amount: args.amount,
      description: args.description,
      date: args.date,
      createdAt: Date.now(),
    });
  },
});

export const listTransactions = query({
  args: { count: v.number() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.tokenIdentifier ?? null;
    const transactions = await ctx.db
      .query('transactions')
      .withIndex('by_userId', (q) => q.eq('userId', userId ?? '__anon__'))
      .order('desc')
      .take(args.count);
    return {
      viewer: userId,
      transactions: transactions.reverse(),
    };
  },
});

// ---------------------------------------------------------------------------
// Budgets
// ---------------------------------------------------------------------------

export const setBudget = mutation({
  args: {
    month: v.string(),
    amount: v.number(),
    currency: v.string(),
    categoryId: v.optional(v.id('categories')),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthenticated');
    const userId = identity.tokenIdentifier;
    const existing = await ctx.db
      .query('budgets')
      .withIndex('by_userId_and_month_and_categoryId', (q) =>
        q
          .eq('userId', userId)
          .eq('month', args.month)
          .eq('categoryId', args.categoryId ?? undefined),
      )
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { amount: args.amount });
      return existing._id;
    }
    return await ctx.db.insert('budgets', {
      userId,
      month: args.month,
      amount: args.amount,
      currency: args.currency,
      categoryId: args.categoryId,
      createdAt: Date.now(),
    });
  },
});

export const listBudgets = query({
  args: { month: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    return await ctx.db
      .query('budgets')
      .withIndex('by_userId_and_month', (q) =>
        q.eq('userId', identity.tokenIdentifier).eq('month', args.month),
      )
      .collect();
  },
});

// ---------------------------------------------------------------------------
// Demo helper: seeds one account + one transaction for the signed-in user.
// ---------------------------------------------------------------------------

export const seedSampleData = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthenticated');
    const userId = identity.tokenIdentifier;
    const accountId = await ctx.db.insert('accounts', {
      userId,
      name: 'Cash',
      type: 'cash',
      currency: 'USD',
      isActive: true,
      createdAt: Date.now(),
    });
    await ctx.db.insert('transactions', {
      userId,
      accountId,
      amount: -Math.floor(Math.random() * 100) - 1,
      description: 'Sample expense',
      date: Date.now(),
      createdAt: Date.now(),
    });
  },
});
