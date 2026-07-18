import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  // Per-user sharing profile: public shareCode others connect by, and the board they're linked to.
  userProfiles: defineTable({
    userId: v.id("users"),
    shareCode: v.string(),
    displayName: v.optional(v.string()),
    linkedBoardId: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_shareCode", ["shareCode"]),

  // A 1:1 shared couple board. Holds the full serialized local board (LWW by updatedAt).
  sharedBoards: defineTable({
    boardId: v.string(),
    memberA: v.id("users"),
    memberB: v.id("users"),
    data: v.any(),
    updatedAt: v.number(),
    updatedBy: v.id("users"),
  }).index("by_boardId", ["boardId"]),

  dailySnapshots: defineTable({
    userId: v.string(),
    date: v.string(),
    wizardProfile: v.any(),
    totals: v.object({
      income: v.number(),
      expenses: v.number(),
      savings: v.number(),
      netWorth: v.optional(v.number()),
    }),
    criticalExpenseCommitment: v.optional(v.object({
      expenseKey: v.string(),
      estimatedMonthlyCost: v.number(),
      status: v.string(),
      compoundProjection: v.object({
        oneYear: v.number(),
        fiveYears: v.number(),
        tenYears: v.number(),
      }),
    })),
    createdAt: v.number(),
  }).index("by_user_and_date", ["userId", "date"]),
});
