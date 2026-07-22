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
    // Accounts the user ORGANIZES (owns). Hard-capped at 5 server-side.
    accountIds: v.optional(v.array(v.string())),
    // Accounts the user was INVITED to (joined as a member, not owner).
    joinedBoardIds: v.optional(v.array(v.string())),
  })
    .index("by_user", ["userId"])
    .index("by_shareCode", ["shareCode"]),

  // A 1:1 shared couple board. Holds the full serialized local board (LWW by updatedAt).
  // RETAINED as-is for backward compat with the shipped couple feature.
  sharedBoards: defineTable({
    boardId: v.string(),
    memberA: v.id("users"),
    memberB: v.id("users"),
    data: v.any(),
    updatedAt: v.number(),
    updatedBy: v.id("users"),
  }).index("by_boardId", ["boardId"]),

  // Accounts feature: per-user account metadata (umbrella grouping + shareable invite).
  accounts: defineTable({
    accountId: v.string(),
    ownerId: v.id("users"),
    umbrella: v.string(),
    name: v.string(),
    inviteCode: v.string(),
    createdAt: v.number(),
    boardId: v.optional(v.string()),
  })
    .index("by_accountId", ["accountId"])
    .index("by_owner", ["ownerId"])
    .index("by_inviteCode", ["inviteCode"]),

  // Membership join table (Convex can't query array-element membership, so we
  // mirror members here for authz + listing; the board keeps a members array
  // only for the 8-cap + quick authz checks).
  boardMembers: defineTable({
    boardId: v.string(),
    userId: v.id("users"),
    role: v.string(), // 'owner' | 'member'
    joinedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_board", ["boardId"]),

  // Multi-member shared board (generalizes the couple sharedBoards).
  accountBoards: defineTable({
    boardId: v.string(),
    accountId: v.string(),
    ownerId: v.id("users"),
    members: v.array(v.id("users")), // 1..8; index[0] = owner
    umbrella: v.string(),
    name: v.string(),
    data: v.any(),
    updatedAt: v.number(),
    updatedBy: v.id("users"),
  }).index("by_boardId", ["boardId"]),

  // Pending/accepted/declined invitations to join an account board.
  invites: defineTable({
    boardId: v.string(),
    fromUserId: v.id("users"),
    toUserId: v.optional(v.id("users")),
    status: v.string(), // 'pending' | 'accepted' | 'declined'
    createdAt: v.number(),
    accountId: v.string(),
    // Shareable board-invite token (for QR/link joins). Empty for shareCode invites.
    token: v.optional(v.string()),
  })
    .index("by_toUser_status", ["toUserId", "status"])
    .index("by_board", ["boardId"])
    .index("by_token", ["token"]),

  dailySnapshots: defineTable({
    userId: v.id("users"),
    accountId: v.optional(v.string()),
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
    fullBackupData: v.optional(v.any()), // Serialized complete local IndexedDB data for recovery
    storeCounts: v.optional(v.record(v.string(), v.number())), // Metadata summary of stored items
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_date", ["userId", "date"]),

  // Versioned, timestamped acceptance record of Terms + Privacy Policy at sign-up.
  // One record per acceptance event (re-recording on version bump is expected).
  legalAgreements: defineTable({
    userId: v.id("users"),
    termsVersion: v.string(),
    privacyVersion: v.string(),
    acceptedAt: v.number(),
    // Optional client metadata captured at acceptance time.
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_acceptedAt", ["acceptedAt"]),

  // Optional cookie consent. Auth-optional: captured before/without sign-in.
  // Kept as a separate table from legalAgreements per compliance isolation.
  cookieConsents: defineTable({
    userId: v.optional(v.id("users")),
    accepted: v.boolean(),
    optionalAccepted: v.boolean(),
    version: v.string(),
    acceptedAt: v.number(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_acceptedAt", ["acceptedAt"]),
});
