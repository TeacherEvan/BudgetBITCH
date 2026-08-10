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
  })
    .index("by_boardId", ["boardId"])
    // Needed by the account purge (Reset All Data): a couple board must be
    // reachable from either member without an unbounded table scan, even when
    // the user's userProfiles.linkedBoardId has already been cleared.
    .index("by_memberA", ["memberA"])
    .index("by_memberB", ["memberB"]),

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
    .index("by_board", ["boardId"])
    .index("by_user_and_board", ["userId", "boardId"]),

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
    // Invites the user SENT — needed so an account purge can remove them
    // without scanning the table.
    .index("by_fromUser", ["fromUserId"])
    .index("by_token", ["token"]),

  // Two-party consent for destructive item deletes on a shared board.
  // Either member of a shared board may request deletion of an item; the
  // DELETE ONLY EXECUTES once the OTHER member approves it. A requester can
  // cancel their own pending request; an approver (the other member) can
  // accept or reject. This prevents one user from unilaterally destroying
  // shared financial data.
  pendingDeletes: defineTable({
    boardId: v.string(),
    store: v.string(), // 'expenses' | 'incomes' | 'bills'
    itemId: v.string(),
    requestedBy: v.id("users"),
    requestedAt: v.number(),
    status: v.string(), // 'pending' | 'approved' | 'rejected' | 'cancelled'
    // Snapshot of the deleted item so approval can apply it deterministically
    // on the board (and re-push), even if the item was later edited locally.
    itemSnapshot: v.optional(v.any()),
  })
    .index("by_board_status", ["boardId", "status"])
    .index("by_requestedBy", ["requestedBy"]),

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

  // Web Push (VAPID) subscriptions — one per browser endpoint, owned by user.
  // Free: VAPID keys in Convex env, web-push library sends. No third-party service.
  pushSubscriptions: defineTable({
    userId: v.id("users"),
    endpoint: v.string(),
    subscription: v.object({
      endpoint: v.string(),
      keys: v.object({
        p256dh: v.string(),
        auth: v.string(),
      }),
    }),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_endpoint", ["endpoint"]),

  // Bug reports / feedback submitted from the app (free Resend email to admin,
  // persisted for triage). No paid crash service.
  feedbackReports: defineTable({
    type: v.union(v.literal("bug"), v.literal("feedback")),
    message: v.string(),
    email: v.optional(v.string()),
    context: v.optional(v.string()),
    actionLogs: v.optional(v.array(v.string())),
    userAgent: v.optional(v.string()),
    locale: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_createdAt", ["createdAt"]),

  // Parsed receipts from AI or scraper bot — linked to user + account for audit trail.
  receipts: defineTable({
    userId: v.id("users"),
    accountId: v.optional(v.string()), // optional: which account/board this belongs to
    // Parsed fields
    amount: v.number(),
    merchant: v.string(),
    category: v.string(),
    date: v.optional(v.string()), // YYYY-MM-DD or null
    // Raw data for reprocessing / debugging
    rawGeminiResponse: v.optional(v.string()),
    imageMimeType: v.string(),
    imageSizeBytes: v.number(),
    imageStorageId: v.optional(v.id("_storage")), // Convex storage ID for the original receipt photo
    // Processing metadata
    parsedAt: v.number(),
    geminiModel: v.string(), // e.g. "gemini-2.5-flash"
    // Scraper bot fields (optional for backwards compatibility)
    clientDraftId: v.optional(v.string()),
    engine: v.optional(v.string()), // 'scraper-bot' | 'gemini'
    templateId: v.optional(v.string()),
    confidence: v.optional(v.any()),
    evidence: v.optional(v.any()),
    ocrText: v.optional(v.string()),
    lineItems: v.optional(v.any()),
    tax: v.optional(v.number()),
    currency: v.optional(v.string()),
    // Itemized receipt lines the bot/scraper extracted and the user reviews.
    // Each item carries the editable title (product name), type (category) and
    // amount so a saved receipt can fan out into one Expense per line and show
    // up itemized in the CSV/Excel export.
    items: v.optional(v.array(v.object({
      title: v.string(),
      type: v.string(),
      amount: v.number(),
    }))),
    questionsAsked: v.optional(v.any()),
    corrections: v.optional(v.any()),
    status: v.optional(v.string()), // 'draft' | 'confirmed'
    // Ingestion source: "app" (default, from the web app) | "line" (from the LINE receipt bot)
    source: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_account", ["userId", "accountId"])
    .index("by_parsedAt", ["parsedAt"])
    .index("by_clientDraftId", ["clientDraftId"]),

  // LINE (LIFF) identity mapping: links a LINE user ID to a Convex user/account
  // so the LINE receipt-bot webhook can resolve the correct owner for an upload.
  lineUsers: defineTable({
    lineUserId: v.string(),
    userId: v.id("users"),
    accountId: v.optional(v.string()),
    linkedAt: v.number(),
  })
    .index("by_lineUserId", ["lineUserId"])
    // Purge path: unlink every LINE identity bound to a user.
    .index("by_user", ["userId"]),

  // Merchant receipt layout templates
  receiptTemplates: defineTable({
    templateId: v.string(),
    version: v.string(),
    country: v.string(),
    fingerprint: v.any(),
    fields: v.any(),
    currency: v.optional(v.string()),
    vatRate: v.optional(v.number()),
    dateOrder: v.optional(v.string()),
    enabled: v.boolean(),
    stats: v.optional(v.any()),
    updatedAt: v.number(),
  })
    .index("by_templateId", ["templateId"])
    .index("by_country", ["country"])
    .index("by_enabled", ["enabled"]),

  // User-learned merchant aliases and category overrides
  merchantAliases: defineTable({
    userId: v.id("users"),
    normalised: v.string(),
    displayName: v.string(),
    category: v.string(),
    hits: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_and_normalised", ["userId", "normalised"])
    // Purge path: delete every alias for a user without a table scan.
    .index("by_user", ["userId"]),
});
