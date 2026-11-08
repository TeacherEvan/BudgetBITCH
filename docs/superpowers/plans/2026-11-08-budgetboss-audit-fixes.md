# Budget Boss Implementation Plan — 2026-11-08

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix P1 correctness bugs, P2 performance/structure issues, and P3 debt items identified in the surgical audit of the Budget Boss codebase.

**Architecture:** Next.js 16 + Convex + IndexedDB local-first architecture. All fixes scoped to existing files — no schema/index changes allowed in this batch.

**Tech Stack:** Next.js 16.3.1, React 19, Convex 1.46+, TypeScript strict, IndexedDB (idb), Vitest, Playwright, Convex Test

**Spec:** `docs/audits/budgetbitch-implementation-plan-2026-11-08.md`

## Global Constraints

- Conventional Commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `ci:`, `chore:`
- Verify each change with `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:convex`, `npm run build` (or `npm run ci`)
- Never change Convex schema/indexes — derive from existing fields
- Display name is "Budget Boss" — never "BudgetBITCH" in UI
- Test comment convention: flip "documents the bug" → "guards regression" at fix time with commit reference
- Failing-first: new assertions must run red against pre-fix code before fix lands
- Count proofs where atomicity matters (`txCount === 1`, duplicate-row count `=== 0`, query-count bound)
- Each phase lands as its own green commit series (fix before its test), separately revertible

---

### Task 1: LINE Webhook Idempotency Fix (P1-1)

**Files:**
- Modify: `convex/line.ts`
- Test: `convex/line.test.ts`

**Interfaces:**
- Consumes: Existing `checkAndRecordWebhookEvent` function
- Produces: Fixed idempotent webhook processing

- [ ] **Step 1: Write failing test for concurrent duplicate webhook calls**

```typescript
// convex/line.test.ts
import { convexTest } from "convex-test";
import { modules } from "./_generated/api";
import schema from "./schema";

test("concurrent duplicate webhook events ingest exactly once", async () => {
  const t = convexTest(schema, modules);
  const event = { message: { id: "msg-1", type: "text", text: "test" } };
  
  // Fire two concurrent duplicate calls
  const [r1, r2] = await Promise.all([
    t.mutation(modules.line.webhook, { events: [event] }),
    t.mutation(modules.line.webhook, { events: [event] }),
  ]);
  
  // Assert exactly one ingestion occurred
  const drafts = await t.query(modules.receipts.listDrafts, { userId: "test-user" });
  expect(drafts.length).toBe(1);
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm run test:convex -- convex/line.test.ts`
Expected: FAIL — duplicate ingestion occurs

- [ ] **Step 3: Implement claim-first idempotency in `convex/line.ts`**

```typescript
// convex/line.ts - modify webhook handler
// Call checkAndRecordWebhookEvent BEFORE processing each event
// Record per messageId so one failure doesn't block siblings
export const webhook = mutation({
  args: { events: v.array(v.any()) },
  handler: async (ctx, args) => {
    for (const event of args.events) {
      const messageId = event.message?.id;
      if (!messageId) continue;
      
      // Claim-first: attempt to record, skip if already processed
      const recorded = await ctx.runMutation(internal.line.checkAndRecordWebhookEvent, {
        messageId,
      });
      if (!recorded) continue; // Already processed
      
      // Process the event...
      await processLineEvent(ctx, event);
    }
  },
});
```

- [ ] **Step 4: Run test to verify it passes**
Run: `npm run test:convex -- convex/line.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add convex/line.ts convex/line.test.ts
git commit -m "fix: LINE webhook idempotency - claim-first per messageId"
```

---

### Task 2: Receipt Ingest Draft Idempotency Fix (P1-1)

**Files:**
- Modify: `convex/receipts/ingest.ts`
- Test: `convex/receipts/ingest.test.ts`

**Interfaces:**
- Consumes: Index `by_user_and_clientDraftId`
- Produces: Atomic insert-or-reuse for draft ingestion

- [ ] **Step 1: Write failing test for concurrent duplicate ingest calls**

```typescript
// convex/receipts/ingest.test.ts
test("concurrent duplicate ingest calls create exactly one draft", async () => {
  const t = convexTest(schema, modules);
  const draftInput = { userId: "user-1", clientDraftId: "draft-abc", items: [] };
  
  const [r1, r2] = await Promise.all([
    t.mutation(modules.receipts.ingestReceipt, draftInput),
    t.mutation(modules.receipts.ingestReceipt, draftInput),
  ]);
  
  const drafts = await t.query(modules.receipts.listDrafts, { userId: "user-1" });
  expect(drafts.length).toBe(1);
  expect(drafts[0].clientDraftId).toBe("draft-abc");
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm run test:convex -- convex/receipts/ingest.test.ts`
Expected: FAIL — double insert on race

- [ ] **Step 3: Implement insert-then-read pattern in `convex/receipts/ingest.ts`**

```typescript
// convex/receipts/ingest.ts - modify ingestReceipt
export const ingestReceipt = mutation({
  args: { ... },
  handler: async (ctx, args) => {
    const { userId, clientDraftId } = args;
    
    // Claim-first: try to insert, on conflict re-read winner
    try {
      const draftId = await ctx.db.insert("receiptDrafts", {
        userId,
        clientDraftId,
        status: "pending",
        items: args.items,
        createdAt: Date.now(),
      });
      return { draftId, created: true };
    } catch (e) {
      if (e instanceof ConvexError && e.message.includes("duplicate")) {
        // Re-read the winner
        const existing = await ctx.db
          .query("receiptDrafts")
          .withIndex("by_user_and_clientDraftId", (q) => q.eq("userId", userId).eq("clientDraftId", clientDraftId))
          .first();
        return { draftId: existing!._id, created: false };
      }
      throw e;
    }
  },
});
```

- [ ] **Step 4: Run test to verify it passes**
Run: `npm run test:convex -- convex/receipts/ingest.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add convex/receipts/ingest.ts convex/receipts/ingest.test.ts
git commit -m "fix: receipt ingest idempotency - insert-then-read on clientDraftId"
```

---

### Task 3: Snapshot Date Idempotency Fix (P1-1)

**Files:**
- Modify: `convex/snapshots.ts`
- Test: `convex/snapshots.test.ts`

**Interfaces:**
- Consumes: Index `by_user_and_date`
- Produces: Atomic upsert for daily snapshots

- [ ] **Step 1: Write failing test for concurrent parallel upserts**

```typescript
// convex/snapshots.test.ts
test("concurrent parallel upserts for same day create exactly one snapshot", async () => {
  const t = convexTest(schema, modules);
  const date = "2026-11-08";
  const data = { totalExpenses: 100, accountBalances: {} };
  
  const [r1, r2] = await Promise.all([
    t.mutation(modules.snapshots.upsertDailySnapshot, { userId: "user-1", date, data }),
    t.mutation(modules.snapshots.upsertDailySnapshot, { userId: "user-1", date, data }),
  ]);
  
  const snapshots = await t.query(modules.snapshots.listSnapshots, { userId: "user-1" });
  expect(snapshots.filter(s => s.date === date).length).toBe(1);
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm run test:convex -- convex/snapshots.test.ts`
Expected: FAIL — two rows created

- [ ] **Step 3: Implement insert-then-read in `convex/snapshots.ts`**

```typescript
// convex/snapshots.ts - modify upsertDailySnapshot
export const upsertDailySnapshot = mutation({
  args: { userId: v.string(), date: v.string(), data: v.any() },
  handler: async (ctx, args) => {
    const { userId, date, data } = args;
    
    try {
      const id = await ctx.db.insert("dailySnapshots", {
        userId,
        date,
        data,
        updatedAt: Date.now(),
      });
      return { snapshotId: id, created: true };
    } catch (e) {
      if (e instanceof ConvexError && e.message.includes("duplicate")) {
        const existing = await ctx.db
          .query("dailySnapshots")
          .withIndex("by_user_and_date", (q) => q.eq("userId", userId).eq("date", date))
          .first();
        // Patch the existing
        await ctx.db.patch(existing!._id, { data, updatedAt: Date.now() });
        return { snapshotId: existing!._id, created: false };
      }
      throw e;
    }
  },
});
```

- [ ] **Step 4: Run test to verify it passes**
Run: `npm run test:convex -- convex/snapshots.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add convex/snapshots.ts convex/snapshots.test.ts
git commit -m "fix: snapshot upsert idempotency - insert-then-read on user+date"
```

---

### Task 4: CSV Import Sign + Date Fix (P1-2)

**Files:**
- Modify: `src/modules/budgeting/csv-import.ts`
- Test: `src/modules/budgeting/csv-import.test.ts`

**Interfaces:**
- Consumes: `normalizeAmount`, `normalizeDate` functions
- Produces: Correct sign preservation and local-date parsing

- [ ] **Step 1: Write failing tests for refund sign and UTC date shift**

```typescript
// src/modules/budgeting/csv-import.test.ts
import { normalizeAmount, normalizeDate } from "./csv-import";

test("normalizeAmount preserves negative for (50.00) refund format", () => {
  expect(normalizeAmount("(50.00)")).toBe(-50.00);
  expect(normalizeAmount("-50.00")).toBe(-50.00);
  expect(normalizeAmount("50.00")).toBe(50.00);
});

test("normalizeDate parses date-only string in negative-offset TZ without UTC shift", () => {
  // Simulate TZ=America/New_York (UTC-5)
  const originalTZ = process.env.TZ;
  process.env.TZ = "America/New_York";
  
  try {
    const result = normalizeDate("Jan 5 2026");
    // Should be 2026-01-05, not 2026-01-04 (UTC shift)
    expect(result).toBe("2026-01-05");
  } finally {
    process.env.TZ = originalTZ;
  }
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm test -- src/modules/budgeting/csv-import.test.ts`
Expected: FAIL — refund returns positive, date shifts

- [ ] **Step 3: Fix `normalizeAmount` and `normalizeDate` in `csv-import.ts`**

```typescript
// src/modules/budgeting/csv-import.ts
export function normalizeAmount(raw: string): number {
  const cleaned = raw.replace(/[$,]/g, "").trim();
  const hadParens = cleaned.startsWith("(") && cleaned.endsWith(")");
  const abs = Math.abs(parseFloat(hadParens ? cleaned.slice(1, -1) : cleaned));
  // FIX: return negative for parens format (refunds)
  return hadParens ? -abs : (cleaned.startsWith("-") ? -abs : abs);
}

export function normalizeDate(raw: string): string {
  const parsed = new Date(raw);
  if (!isNaN(parsed.getTime())) {
    // FIX: use local components instead of toISOString()
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  // ... existing fallback logic
}
```

- [ ] **Step 4: Run test to verify it passes**
Run: `npm test -- src/modules/budgeting/csv-import.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/modules/budgeting/csv-import.ts src/modules/budgeting/csv-import.test.ts
git commit -m "fix: csv-import - preserve refund sign and fix UTC date shift"
```

---

### Task 5: Invite Edge Cases + Consent Matrix (P1-3)

**Files:**
- Modify: `convex/accounts/accountInvites.ts`
- Modify: `convex/pendingDeletes.ts`
- Test: `convex/accounts/accountInvites.test.ts`
- Test: `convex/pendingDeletes.test.ts`

**Interfaces:**
- Consumes: `declineInvite`, `acceptInvite`, `approveDelete`, `rejectDelete` mutations
- Produces: Status checks, concurrency bounds, correct authorization

- [ ] **Step 1: Write failing tests**

```typescript
// convex/accounts/accountInvites.test.ts
test("declineInvite throws when status !== 'pending'", async () => {
  const t = convexTest(schema, modules);
  const invite = await t.mutation(modules.accounts.createInvite, { ... });
  await t.mutation(modules.accounts.acceptInvite, { inviteCode: invite.code });
  
  await expect(
    t.mutation(modules.accounts.declineInvite, { inviteCode: invite.code })
  ).rejects.toThrow("not pending");
});

test("concurrent accepts respect MAX_MEMBERS cap", async () => {
  const t = convexTest(schema, modules);
  const board = await t.mutation(modules.accounts.createBoard, { ... });
  const invites = await Promise.all(
    Array(5).fill(null).map(() => t.mutation(modules.accounts.createInvite, { boardId: board._id }))
  );
  
  const results = await Promise.allSettled(
    invites.map(invite => t.mutation(modules.accounts.acceptInvite, { inviteCode: invite.code }))
  );
  
  const fulfilled = results.filter(r => r.status === "fulfilled").length;
  expect(fulfilled).toBeLessThanOrEqual(4); // MAX_MEMBERS
});

// convex/pendingDeletes.test.ts
test("approveDelete requires otherMemberId, not any member", async () => {
  const t = convexTest(schema, modules);
  // Setup: board with 3 members, memberA requests delete
  // memberC (not the other member) tries to approve
  await expect(
    t.mutation(modules.pendingDeletes.approveDelete, { requestId, userId: memberC })
  ).rejects.toThrow("unauthorized");
});
```

- [ ] **Step 2: Run tests to verify they fail**
Run: `npm run test:convex -- convex/accounts/accountInvites.test.ts convex/pendingDeletes.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement fixes**

```typescript
// convex/accounts/accountInvites.ts - declineInvite
export const declineInvite = mutation({
  args: { inviteCode: v.string() },
  handler: async (ctx, args) => {
    const invite = await ctx.db
      .query("invites")
      .withIndex("by_code", (q) => q.eq("code", args.inviteCode))
      .first();
    
    if (!invite) throw new ConvexError("Invite not found");
    if (invite.status !== "pending") {
      throw new ConvexError("Invite is no longer pending"); // NEW CHECK
    }
    
    await ctx.db.patch(invite._id, { status: "declined" });
  },
});

// acceptInvite - bound concurrent over-cap
export const acceptInvite = mutation({
  args: { inviteCode: v.string() },
  handler: async (ctx, args) => {
    // ... existing logic ...
    // After inserting member, re-check count
    const members = await ctx.db
      .query("boardMembers")
      .withIndex("by_board", (q) => q.eq("boardId", boardId))
      .collect();
    
    if (members.length > MAX_MEMBERS) {
      // Roll back: delete the just-inserted member row
      await ctx.db.delete(newMemberId);
      throw new ConvexError("Board is full");
    }
  },
});

// convex/pendingDeletes.ts - approveDelete
export const approveDelete = mutation({
  args: { requestId: v.id("pendingDeletes"), userId: v.string() },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) throw new ConvexError("Request not found");
    
    // NEW: approver must be THE other member
    const board = await ctx.db.get(request.boardId);
    const otherMemberId = board.members.find(m => m !== request.requestedBy);
    if (args.userId !== otherMemberId) {
      throw new ConvexError("Only the other member can approve");
    }
    // ... rest of approval logic
  },
});

// rejectDelete - requester OR other member can reject
export const rejectDelete = mutation({
  args: { requestId: v.id("pendingDeletes"), userId: v.string() },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    const board = await ctx.db.get(request.boardId);
    const otherMemberId = board.members.find(m => m !== request.requestedBy);
    
    if (args.userId !== request.requestedBy && args.userId !== otherMemberId) {
      throw new ConvexError("Unauthorized to reject");
    }
    // ... rest
  },
});
```

- [ ] **Step 4: Run tests to verify they pass**
Run: `npm run test:convex -- convex/accounts/accountInvites.test.ts convex/pendingDeletes.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add convex/accounts/accountInvites.ts convex/pendingDeletes.ts convex/accounts/accountInvites.test.ts convex/pendingDeletes.test.ts
git commit -m "fix: invite decline status check, accept concurrency cap, consent matrix authorization"
```

---

### Task 6: Quick-Add Dirty Guard + Confirm-First Ordering (P1-4)

**Files:**
- Modify: `src/hooks/use-quick-add-state.ts`
- Test: `src/app/quick-add/page.test.tsx`

**Interfaces:**
- Consumes: `useQuickAddState` hook, `botDraft` effect, `confirmBotDraft`, `addExpense`
- Produces: Dirty guard, effect dep cleanup, confirm-then-local-add ordering

- [ ] **Step 1: Write failing tests**

```typescript
// src/app/quick-add/page.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QuickAddPage } from "./page";

test("edit-then-realtime-update preserves user edits", async () => {
  const { rerender } = render(<QuickAddPage />);
  
  // User edits scanned merchant field
  const merchantInput = screen.getByLabelText("Merchant");
  fireEvent.change(merchantInput, { target: { value: "User Edited" } });
  
  // Simulate realtime bot-draft update
  rerender(<QuickAddPage initialBotDraft={{ merchant: "Bot Value" }} />);
  
  // User edit should persist
  expect(merchantInput.value).toBe("User Edited");
});

test("double-click Save writes once (confirm-then-local-add guard)", async () => {
  const { container } = render(<QuickAddPage />);
  const saveBtn = screen.getByRole("button", { name: /save/i });
  
  fireEvent.click(saveBtn);
  fireEvent.click(saveBtn); // Rapid double-click
  
  await waitFor(() => {
    // Should only have one expense added, not two
    expect(mockAddExpense).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**
Run: `npm test -- src/app/quick-add/page.test.tsx`
Expected: FAIL — bot draft clobbers edits, double-save duplicates

- [ ] **Step 3: Implement fixes in `use-quick-add-state.ts`**

```typescript
// src/hooks/use-quick-add-state.ts
export function useQuickAddState() {
  const [userEdited, setUserEdited] = useRef(new Set<string>());
  const confirmedDraftId = useRef<string | null>(null);
  
  // Track user edits
  const updateScannedLineItem = (field: string, value: any) => {
    userEdited.current.add(field);
    setScannedLineItem(prev => ({ ...prev, [field]: value }));
  };
  
  // Bot draft effect - returns early if user edited
  useEffect(() => {
    if (!botDraft) return;
    
    // Check if user has edited any field
    const editedFields = userEdited.current;
    if (editedFields.size > 0) {
      // Only fill non-edited fields
      const updates: Partial<ScannedLineItem> = {};
      for (const [key, value] of Object.entries(botDraft)) {
        if (!editedFields.has(key)) {
          updates[key] = value;
        }
      }
      if (Object.keys(updates).length > 0) {
        setScannedLineItem(prev => ({ ...prev, ...updates }));
      }
      return; // Don't clobber edited fields
    }
    
    // No edits - safe to apply full draft
    setScannedLineItem(botDraft);
  }, [botDraft?._id]); // CHANGED: depend on _id, not botDraftId
  
  // Confirm-first ordering with re-entry guard
  const handleSave = async () => {
    if (confirmedDraftId.current === botDraft?._id) {
      return; // Already confirmed this draft
    }
    
    if (botDraft) {
      await confirmBotDraft(botDraft._id);
      confirmedDraftId.current = botDraft._id;
    }
    
    // Only add expense after successful confirm
    await addExpense(getExpenseData());
  };
  
  // Reset guards on new draft
  useEffect(() => {
    if (botDraft?._id !== confirmedDraftId.current) {
      confirmedDraftId.current = null;
      userEdited.current.clear();
    }
  }, [botDraft?._id]);
}
```

- [ ] **Step 4: Run tests to verify they pass**
Run: `npm test -- src/app/quick-add/page.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/hooks/use-quick-add-state.ts src/app/quick-add/page.test.tsx
git commit -m "fix: quick-add dirty guard, confirm-first ordering, effect dep cleanup"
```

---

### Task 7: Atomic Timestamp Writes + Restore Preservation (P1-5)

**Files:**
- Modify: `src/lib/db/local-db.ts`
- Modify: `src/lib/db/stores/expenses-store.ts`
- Modify: `src/lib/convex/sync-snapshots.ts`
- Test: `src/lib/db/local-db.test.ts`
- Test: `src/lib/convex/sync-snapshots.test.ts`

**Interfaces:**
- Consumes: `recordLocalWritesBulk`, `afterBoardMutation`, restore logic
- Produces: Single transaction per mutation, preserved timestamps on restore

- [ ] **Step 1: Write failing tests**

```typescript
// src/lib/db/local-db.test.ts
test("each board mutation writes data + localWrites in single transaction", async () => {
  const db = await openDB();
  let txCount = 0;
  const originalTransaction = db.transaction.bind(db);
  db.transaction = (...args) => {
    txCount++;
    return originalTransaction(...args);
  };
  
  await addExpense(db, { ... });
  
  expect(txCount).toBe(1); // Single transaction for expense + localWrites
});

test("restore preserves newer remote updatedAt instead of flattening to now", async () => {
  const db = await openDB();
  const remoteExpense = {
    id: "exp-1",
    amount: 100,
    updatedAt: Date.now() + 10000, // Future timestamp (newer than local)
  };
  
  await restoreBoardData(db, { expenses: [remoteExpense] });
  
  const restored = await getExpense(db, "exp-1");
  expect(restored.updatedAt).toBe(remoteExpense.updatedAt); // Preserved, not flattened
});
```

- [ ] **Step 2: Run tests to verify they fail**
Run: `npm test -- src/lib/db/local-db.test.ts src/lib/convex/sync-snapshots.test.ts`
Expected: FAIL — separate transactions, timestamps flattened

- [ ] **Step 3: Implement fixes**

```typescript
// src/lib/db/stores/expenses-store.ts - extend recordLocalWritesBulk
export async function recordLocalWritesBulk(
  db: IDBDatabase,
  writes: Array<{ store: string; data: any }>
): Promise<void> {
  const tx = db.transaction(["expenses", "localWrites"], "readwrite");
  const expenseStore = tx.objectStore("expenses");
  const writesStore = tx.objectStore("localWrites");
  
  for (const write of writes) {
    await expenseStore.put(write.data);
    await writesStore.put({
      store: write.store,
      itemId: write.data.id,
      updatedAt: write.data.updatedAt || Date.now(),
    });
  }
  
  await new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = reject;
  });
}

// src/lib/convex/sync-snapshots.ts - restore preserves timestamps
export async function restoreFromSnapshot(
  db: IDBDatabase,
  payload: BoardPayload
): Promise<void> {
  const tx = db.transaction(["expenses", "localWrites"], "readwrite");
  const expenseStore = tx.objectStore("expenses");
  const writesStore = tx.objectStore("localWrites");
  
  for (const expense of payload.expenses) {
    // Preserve remote updatedAt if present and newer
    const storedTs = expense.updatedAt || Date.now();
    const now = Date.now();
    const finalTs = Math.max(storedTs, now); // Fallback to max(now, payloadTs)
    
    await expenseStore.put({ ...expense, updatedAt: finalTs });
    await writesStore.put({
      store: "expenses",
      itemId: expense.id,
      updatedAt: finalTs,
    });
  }
  
  await new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = reject;
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**
Run: `npm test -- src/lib/db/local-db.test.ts src/lib/convex/sync-snapshots.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/lib/db/local-db.ts src/lib/db/stores/expenses-store.ts src/lib/convex/sync-snapshots.ts src/lib/db/local-db.test.ts src/lib/convex/sync-snapshots.test.ts
git commit -m "fix: atomic timestamp writes, restore preserves remote updatedAt"
```

---

### Task 8: List Fan-out N+1 Fix (P2-1)

**Files:**
- Modify: `convex/accounts/accountCrud.ts`
- Test: `convex/accounts/accountCrud.test.ts`

**Interfaces:**
- Consumes: `listMyAccounts`, `getBoardMemberIds`, userProfiles cache
- Produces: Hoisted display-name cache, skipped redundant fetches

- [ ] **Step 1: Write failing test with query-count assertion**

```typescript
// convex/accounts/accountCrud.test.ts
test("listMyAccounts query count ≤ accounts + members + 2", async () => {
  const t = convexTest(schema, modules);
  
  // Create 10 accounts with 5 members each
  const boards = await Promise.all(
    Array(10).fill(null).map(() => t.mutation(modules.accounts.createBoard, { ... }))
  );
  // Add members to each...
  
  let queryCount = 0;
  const originalQuery = t.query.bind(t);
  t.query = async (...args) => {
    queryCount++;
    return originalQuery(...args);
  };
  
  await t.query(modules.accounts.listMyAccounts, { userId: "user-1" });
  
  // Should be: 1 (boards) + 1 (profiles for unique members) + 1 (invites) + 1 (ownedIds map) = 4
  // Not 10 * 5 = 50 per-account queries
  expect(queryCount).toBeLessThanOrEqual(10 + 5 + 2); // accounts + members + 2
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm run test:convex -- convex/accounts/accountCrud.test.ts`
Expected: FAIL — N+1 queries

- [ ] **Step 3: Implement hoisted cache in `accountCrud.ts`**

```typescript
// convex/accounts/accountCrud.ts - listMyAccounts
export const listMyAccounts = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const userId = args.userId;
    
    // 1. Get all boards user is member of (single query)
    const memberRows = await ctx.db
      .query("boardMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    
    const boardIds = [...new Set(memberRows.map(m => m.boardId))];
    
    // 2. Get all unique member IDs across all boards (single query per board)
    const allMemberIds = new Set<string>();
    for (const boardId of boardIds) {
      const members = await ctx.db
        .query("boardMembers")
        .withIndex("by_board", (q) => q.eq("boardId", boardId))
        .collect();
      members.forEach(m => allMemberIds.add(m.userId));
    }
    
    // 3. Fetch ALL profiles in ONE batch (hoisted cache)
    const profiles = await Promise.all(
      Array.from(allMemberIds).map(id => 
        ctx.db.get(id).then(u => u ? { id, name: u.name, avatar: u.avatar } : null)
      )
    );
    const profileMap = new Map(profiles.filter(Boolean).map(p => [p!.id, p!]));
    
    // 4. Fetch ownedIds map (1 query)
    const ownedIds = await ctx.db
      .query("boards")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .collect();
    const ownedMap = new Map(ownedIds.map(b => [b._id, true]));
    
    // 5. Build account list using cached data (no per-account queries)
    const accounts = boardIds.map(boardId => {
      const board = ...; // from earlier or fetch once
      const members = board.memberIds.map(id => profileMap.get(id)!);
      return { board, members, isOwned: ownedMap.has(boardId) };
    });
    
    return accounts;
  },
});
```

- [ ] **Step 4: Run test to verify it passes**
Run: `npm run test:convex -- convex/accounts/accountCrud.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add convex/accounts/accountCrud.ts convex/accounts/accountCrud.test.ts
git commit -m "perf: listMyAccounts hoist profile cache, eliminate N+1 queries"
```

---

### Task 9: Purge Scheduler Chunked Deletion (P1-6)

**Files:**
- Modify: `convex/purge.ts`
- Modify: `convex/snapshots.ts`
- Modify: `convex/crons.ts`
- Test: `convex/purge.test.ts`
- Test: `convex/snapshots.test.ts`

**Interfaces:**
- Consumes: `purgeUserData`, `deleteAllUserSnapshots`, scheduler
- Produces: Chunked purges ≤500 rows, profile deleted last

- [ ] **Step 1: Write failing tests with >500 synthetic rows**

```typescript
// convex/purge.test.ts
test("purgeUserData completes across chunks for >500 rows", async () => {
  const t = convexTest(schema, modules);
  const userId = "user-large";
  
  // Insert 600 expenses
  for (let i = 0; i < 600; i++) {
    await t.mutation(modules.expenses.addExpense, { userId, amount: 10, ... });
  }
  
  // Run purge - should complete without timeout
  await t.mutation(modules.purge.purgeUserData, { userId });
  
  // Verify all deleted
  const expenses = await t.query(modules.expenses.listExpenses, { userId });
  expect(expenses.length).toBe(0);
  
  // Profile should be deleted last (verify via separate check or log)
});

// convex/snapshots.test.ts
test("deleteAllUserSnapshots chunks correctly", async () => {
  const t = convexTest(schema, modules);
  const userId = "user-snap";
  
  for (let i = 0; i < 600; i++) {
    await t.mutation(modules.snapshots.upsertDailySnapshot, { 
      userId, 
      date: `2026-01-${String(i % 28 + 1).padStart(2, "0")}`, 
      data: {} 
    });
  }
  
  await t.mutation(modules.purge.deleteAllUserSnapshots, { userId });
  
  const snaps = await t.query(modules.snapshots.listSnapshots, { userId });
  expect(snaps.length).toBe(0);
});
```

- [ ] **Step 2: Run tests to verify they fail**
Run: `npm run test:convex -- convex/purge.test.ts convex/snapshots.test.ts`
Expected: FAIL — execution limit hit

- [ ] **Step 3: Implement chunked scheduler in `purge.ts` and `snapshots.ts`**

```typescript
// convex/purge.ts - chunked purge
const CHUNK_SIZE = 500;

export const purgeUserData = internalMutation({
  args: { userId: v.string(), cursor: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const { userId, cursor } = args;
    
    // Delete expenses chunk
    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter(q => cursor ? q.gt("_id", cursor) : q)
      .take(CHUNK_SIZE)
      .collect();
    
    for (const exp of expenses) {
      await ctx.db.delete(exp._id);
    }
    
    if (expenses.length === CHUNK_SIZE) {
      // Schedule next chunk
      const nextCursor = expenses[expenses.length - 1]._id;
      await ctx.scheduler.runAfter(0, internal.purge.purgeUserData, { userId, cursor: nextCursor });
      return { done: false, nextCursor };
    }
    
    // Expenses done - delete other tables similarly...
    // Finally delete profile
    await ctx.db.delete(userId); // Profile last
    return { done: true };
  },
});

// convex/snapshots.ts - chunked snapshot deletion
export const deleteAllUserSnapshots = internalMutation({
  args: { userId: v.string(), cursor: v.optional(v.string()) },
  handler: async (ctx, args) => {
    // Same pattern for snapshots table
    const snapshots = await ctx.db
      .query("dailySnapshots")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter(q => args.cursor ? q.gt("_id", args.cursor) : q)
      .take(CHUNK_SIZE)
      .collect();
    
    for (const snap of snapshots) {
      await ctx.db.delete(snap._id);
    }
    
    if (snapshots.length === CHUNK_SIZE) {
      await ctx.scheduler.runAfter(0, internal.snapshots.deleteAllUserSnapshots, {
        userId,
        cursor: snapshots[snapshots.length - 1]._id,
      });
      return { done: false };
    }
    return { done: true };
  },
});

// convex/crons.ts - schedule purges
export const dailyPurgeCron = cron({
  // ... existing cron that calls purgeUserData without cursor (starts fresh)
});
```

- [ ] **Step 4: Run tests to verify they pass**
Run: `npm run test:convex -- convex/purge.test.ts convex/snapshots.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add convex/purge.ts convex/snapshots.ts convex/crons.ts convex/purge.test.ts convex/snapshots.test.ts
git commit -m "fix: chunked purge scheduler for large accounts, profile deleted last"
```

---

### Task 10: Share-Code Uniqueness + Split-Brain Profile (P1-7)

**Files:**
- Modify: `convex/sharedBoards.ts`
- Modify: `convex/accounts/helpers.ts`
- Modify: `convex/accounts/accountInvites.ts`
- Test: `convex/sharedBoards.test.ts`
- Test: `convex/accounts/helpers.test.ts`

**Interfaces:**
- Consumes: `ensureProfileDoc`, `generateShareCode`, `resolveShareCode`, `inviteByCode`
- Produces: Single profile factory, duplicate-tolerant lookups

- [ ] **Step 1: Write failing tests for duplicate code safety**

```typescript
// convex/sharedBoards.test.ts
test("resolveShareCode fails closed on duplicate codes instead of throwing Server Error", async () => {
  const t = convexTest(schema, modules);
  
  // Manually insert two profiles with same shareCode (simulating wild duplicates)
  await t.mutation(modules.accounts.helpers.createProfile, { userId: "user-1", shareCode: "ABC123" });
  await t.mutation(modules.accounts.helpers.createProfile, { userId: "user-2", shareCode: "ABC123" });
  
  // Should fail closed with user-friendly message
  await expect(
    t.query(modules.sharedBoards.resolveShareCode, { code: "ABC123" })
  ).rejects.toThrow("code ambiguous, contact support");
});

test("inviteByCode handles duplicates gracefully", async () => {
  const t = convexTest(schema, modules);
  // Same setup
  await expect(
    t.query(modules.accounts.inviteByCode, { code: "ABC123" })
  ).rejects.toThrow("code ambiguous, contact support");
});
```

- [ ] **Step 2: Run tests to verify they fail**
Run: `npm run test:convex -- convex/sharedBoards.test.ts convex/accounts/helpers.test.ts`
Expected: FAIL — .unique() throws Server Error

- [ ] **Step 3: Implement fixes**

```typescript
// convex/accounts/helpers.ts - SINGLE profile factory (accounts shape wins)
export async function ensureProfileDoc(ctx: MutationCtx, userId: Id<"users">): Promise<Id<"userProfiles">> {
  const existing = await ctx.db
    .query("userProfiles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();
  
  if (existing) return existing._id;
  
  const shareCode = generateShareCode();
  return ctx.db.insert("userProfiles", { userId, shareCode, ... });
}

export function generateShareCode(): string {
  // ... existing implementation
}

// convex/sharedBoards.ts - DELETE duplicate, IMPORT helpers
// REMOVE: ensureProfileDoc, generateShareCode
// ADD: import { ensureProfileDoc, generateShareCode } from "./accounts/helpers";

// convex/sharedBoards.ts - resolveShareCode duplicate-tolerant
export const resolveShareCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("userProfiles")
      .withIndex("by_shareCode", (q) => q.eq("shareCode", args.code))
      .take(2) // TAKE 2 instead of .unique()
      .collect();
    
    if (results.length === 0) throw new ConvexError("Invalid code");
    if (results.length > 1) {
      throw new ConvexError("Code ambiguous, contact support"); // FAIL CLOSED
    }
    return results[0];
  },
});

// convex/accounts/accountInvites.ts - inviteByCode same pattern
export const inviteByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("userProfiles")
      .withIndex("by_shareCode", (q) => q.eq("shareCode", args.code))
      .take(2)
      .collect();
    
    if (results.length === 0) throw new ConvexError("Invalid code");
    if (results.length > 1) {
      throw new ConvexError("Code ambiguous, contact support");
    }
    return results[0];
  },
});
```

- [ ] **Step 4: Run tests to verify they pass**
Run: `npm run test:convex -- convex/sharedBoards.test.ts convex/accounts/helpers.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add convex/sharedBoards.ts convex/accounts/helpers.ts convex/accounts/accountInvites.ts convex/sharedBoards.test.ts convex/accounts/helpers.test.ts
git commit -m "fix: single profile factory, duplicate-tolerant share-code lookups"
```

---

### Task 11: Blob Validation + Finite Timestamps (P2-2)

**Files:**
- Modify: `convex/boardMerge.ts`
- Modify: `convex/sharedBoards.ts`
- Modify: `convex/accounts/accountBoardSync.ts`
- Test: `convex/boardMerge.test.ts`
- Test: `convex/sharedBoards.test.ts`

**Interfaces:**
- Consumes: `pushBoard`, `pushAccountBoard`, `mergeRecords`
- Produces: Key-shape validation, finite timestamp rejection

- [ ] **Step 1: Write failing tests**

```typescript
// convex/boardMerge.test.ts
test("pushBoard rejects unknown key prefixes", async () => {
  const t = convexTest(schema, modules);
  
  await expect(
    t.mutation(modules.sharedBoards.pushBoard, {
      boardId: "board-1",
      incoming: {
        "garbage:key": { data: "x", updatedAt: Date.now() },
        "expenses:exp-1": { data: { amount: 10 }, updatedAt: Date.now() },
      },
    })
  ).rejects.toThrow("invalid key prefix");
});

test("mergeRecords rejects Infinity/NaN timestamps", async () => {
  const t = convexTest(schema, modules);
  
  const result = mergeRecords([
    { store: "expenses", itemId: "exp-1", updatedAt: Infinity },
    { store: "expenses", itemId: "exp-2", updatedAt: NaN },
    { store: "expenses", itemId: "exp-3", updatedAt: Date.now() },
  ]);
  
  expect(result).toHaveLength(1); // Only valid one kept
  expect(result[0].itemId).toBe("exp-3");
});
```

- [ ] **Step 2: Run tests to verify they fail**
Run: `npm run test:convex -- convex/boardMerge.test.ts convex/sharedBoards.test.ts`
Expected: FAIL — validation missing

- [ ] **Step 3: Implement validation**

```typescript
// convex/boardMerge.ts - mergeRecords validation
export function mergeRecords(incoming: Record<string, { data: any; updatedAt: number }>): MergedRecord[] {
  const validPrefixes = ["expenses", "accounts", "categories", "budgets", "recurring"];
  
  const results: MergedRecord[] = [];
  
  for (const [key, value] of Object.entries(incoming)) {
    // Validate key shape: store:itemId
    const colonIdx = key.indexOf(":");
    if (colonIdx <= 0 || colonIdx === key.length - 1) continue;
    
    const store = key.slice(0, colonIdx);
    const itemId = key.slice(colonIdx + 1);
    
    if (!validPrefixes.includes(store)) continue; // Reject unknown prefixes
    
    // Validate timestamp: finite, non-negative
    const ts = value.updatedAt;
    if (!Number.isFinite(ts) || ts < 0) continue; // Reject Infinity, NaN, negative
    
    results.push({ store, itemId, data: value.data, updatedAt: ts });
  }
  
  return results;
}

// convex/sharedBoards.ts - pushBoard validation
export const pushBoard = mutation({
  args: { boardId: v.id("boards"), incoming: v.any() },
  handler: async (ctx, args) => {
    // Validate all keys before merge
    const merged = mergeRecords(args.incoming);
    if (merged.length !== Object.keys(args.incoming).length) {
      throw new ConvexError("Invalid payload: unknown keys or bad timestamps");
    }
    // ... proceed with merge
  },
});

// convex/accounts/accountBoardSync.ts - pushAccountBoard same validation
export const pushAccountBoard = mutation({
  args: { boardId: v.id("boards"), incoming: v.any() },
  handler: async (ctx, args) => {
    const merged = mergeRecords(args.incoming);
    if (merged.length !== Object.keys(args.incoming).length) {
      throw new ConvexError("Invalid payload: unknown keys or bad timestamps");
    }
    // ... proceed
  },
});
```

- [ ] **Step 4: Run tests to verify they pass**
Run: `npm run test:convex -- convex/boardMerge.test.ts convex/sharedBoards.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add convex/boardMerge.ts convex/sharedBoards.ts convex/accounts/accountBoardSync.ts convex/boardMerge.test.ts convex/sharedBoards.test.ts
git commit -m "fix: blob key-shape validation, finite timestamp rejection in merge"
```

---

### Task 12: use-local-db Error State + Stale Response Guard (P2-3)

**Files:**
- Modify: `src/hooks/use-local-db.ts`
- Test: `src/hooks/use-local-db.test.ts`

**Interfaces:**
- Consumes: `useLocalDB` hook family, mounted-flag pattern
- Produces: Error surface, request-sequence guard

- [ ] **Step 1: Write failing tests**

```typescript
// src/hooks/use-local-db.test.ts
import { renderHook, act } from "@testing-library/react";
import { useLocalDB } from "./use-local-db";

test("failed load exposes error field instead of stale loading:false", async () => {
  // Mock IDB to fail
  const { result } = renderHook(() => useLocalDB("expenses"));
  
  await act(async () => {
    await waitFor(() => result.current.loading === false);
  });
  
  expect(result.current.error).toBeDefined(); // Should have error
  expect(result.current.data).toBeNull(); // Not stale data
});

test("slow first load can't overwrite fresher event load", async () => {
  const { result, rerender } = renderHook(
    ({ version }) => useLocalDB("expenses", { version }),
    { initialProps: { version: 1 } }
  );
  
  // Start slow load (version 1)
  const loadPromise = act(async () => {
    await waitFor(() => result.current.loading === false);
  });
  
  // Trigger fresher event load (version 2) before first completes
  rerender({ version: 2 });
  
  await loadPromise;
  
  // Should have version 2 data, not version 1 stale data
  expect(result.current.dataVersion).toBe(2);
});
```

- [ ] **Step 2: Run tests to verify they fail**
Run: `npm test -- src/hooks/use-local-db.test.ts`
Expected: FAIL — error not surfaced, stale responses overwrite

- [ ] **Step 3: Implement request-sequence guard + error surface**

```typescript
// src/hooks/use-local-db.ts
export function useLocalDB(storeName: string, options?: { version?: number }) {
  const [state, setState] = useState({ data: null, loading: true, error: null, version: 0 });
  const requestSeq = useRef(0);
  
  useEffect(() => {
    let cancelled = false;
    const mySeq = ++requestSeq.current; // Increment sequence
    
    const load = async () => {
      try {
        const db = await openDB();
        const data = await db.getAll(storeName);
        
        // Stale response guard: ignore if sequence changed
        if (cancelled || requestSeq.current !== mySeq) return;
        
        setState({ data, loading: false, error: null, version: options?.version || 0 });
      } catch (e) {
        if (cancelled || requestSeq.current !== mySeq) return;
        setState({ data: null, loading: false, error: e, version: options?.version || 0 });
      }
    };
    
    load();
    
    // Event listener for realtime updates
    const handleUpdate = () => {
      const newSeq = ++requestSeq.current;
      load(); // New request with new sequence
    };
    
    window.addEventListener("local-db-update", handleUpdate);
    
    return () => {
      cancelled = true;
      window.removeEventListener("local-db-update", handleUpdate);
    };
  }, [storeName, options?.version]); // Version change triggers fresh load
  
  return state;
}
```

- [ ] **Step 4: Run tests to verify they pass**
Run: `npm test -- src/hooks/use-local-db.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/hooks/use-local-db.ts src/hooks/use-local-db.test.ts
git commit -m "fix: use-local-db error surface, request-sequence stale guard"
```

---

### Task 13: Crypto Hardening + Due-Day Clamp (P3-1)

**Files:**
- Modify: `src/lib/db/crypto-backup.ts`
- Modify: `src/components/dashboard/priority-guide.tsx`
- Modify: `src/components/dashboard/dashboard-shell.tsx`
- Test: `src/lib/db/crypto-backup.test.ts`
- Test: `src/components/dashboard/priority-guide.test.tsx`

**Interfaces:**
- Consumes: `encryptBackup`, `decryptBackup`, `dueDay` prop
- Produces: PBKDF2 600k, empty password rejection, backward-compatible decrypt, due-day clamp

- [ ] **Step 1: Write failing tests**

```typescript
// src/lib/db/crypto-backup.test.ts
test("encryptBackup rejects empty password", async () => {
  await expect(encryptBackup(data, "")).rejects.toThrow("password required");
});

test("decryptBackup works with old 100k iteration backups", async () => {
  const oldBackup = await encryptBackupLegacy(data, "password"); // 100k iterations
  const decrypted = await decryptBackup(oldBackup, "password");
  expect(decrypted).toEqual(data);
});

test("decryptBackup rejects short salt", async () => {
  const badBackup = { ...validBackup, salt: new Uint8Array(8) }; // Too short
  await expect(decryptBackup(badBackup, "password")).rejects.toThrow("invalid salt");
});

// src/components/dashboard/priority-guide.test.tsx
test("dueDay clamped to month length (Feb 31 -> Feb 28/29)", () => {
  const { result } = renderHook(() => useDueDayClamp(31, 1)); // Feb 31
  expect(result.current).toBe(28); // Or 29 in leap year
});
```

- [ ] **Step 2: Run tests to verify they fail**
Run: `npm test -- src/lib/db/crypto-backup.test.ts src/components/dashboard/priority-guide.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement fixes**

```typescript
// src/lib/db/crypto-backup.ts
const PBKDF2_ITERATIONS = 600_000;
const LEGACY_ITERATIONS = 100_000;
const MIN_SALT_LENGTH = 16;

export async function encryptBackup(data: any, password: string): Promise<EncryptedBackup> {
  if (!password || password.length === 0) {
    throw new Error("Password required for encryption");
  }
  
  const salt = crypto.getRandomValues(new Uint8Array(32));
  const key = await deriveKey(password, salt, PBKDF2_ITERATIONS);
  // ... encrypt
  return { ciphertext, salt, iv, iterations: PBKDF2_ITERATIONS };
}

export async function decryptBackup(backup: EncryptedBackup, password: string): Promise<any> {
  if (!password || password.length === 0) {
    throw new Error("Password required for decryption");
  }
  
  if (backup.salt.length < MIN_SALT_LENGTH) {
    throw new Error("Invalid salt length");
  }
  
  // Backward compatible: use stored iterations or default to legacy
  const iterations = backup.iterations || LEGACY_ITERATIONS;
  const key = await deriveKey(password, backup.salt, iterations);
  // ... decrypt
}

// src/components/dashboard/priority-guide.tsx (and dashboard-shell.tsx)
function clampDueDay(dueDay: number, month: number, year: number): number {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return Math.min(dueDay, daysInMonth);
}

// Usage in component:
const clampedDueDay = clampDueDay(bill.dueDay, bill.month, bill.year);
```

- [ ] **Step 4: Run tests to verify they pass**
Run: `npm test -- src/lib/db/crypto-backup.test.ts src/components/dashboard/priority-guide.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/lib/db/crypto-backup.ts src/components/dashboard/priority-guide.tsx src/components/dashboard/dashboard-shell.tsx src/lib/db/crypto-backup.test.ts src/components/dashboard/priority-guide.test.tsx
git commit -m "fix: PBKDF2 600k with legacy decrypt, empty password reject, due-day clamp"
```

---

### Task 14: Dead-Code Verification Pass (P2-4)

**Files:**
- Modify: Various (sweep candidates only)
- Test: `npm run ci` full gate

**Interfaces:**
- Consumes: `EXCEL_TABS`, `createPanelConfigs`, `buildExcelPanels`, unused `Card*` sub-exports, `usePriorityAlerts` export veneer
- Produces: Verified deletions with grep proof

- [ ] **Step 1: For each candidate, run grep and document**

```bash
# Example for EXCEL_TABS
grep -rn "EXCEL_TABS" src/ tests/ e2e/ || echo "NO REFERENCES FOUND"

# Example for createPanelConfigs
grep -rn "createPanelConfigs" src/ tests/ e2e/ || echo "NO REFERENCES FOUND"

# ... repeat for each candidate
```

- [ ] **Step 2: Delete only zero-external-reference symbols**

```bash
# After verifying grep returns nothing for a symbol:
# Edit file to remove the export/declaration
```

- [ ] **Step 3: Run full CI gate**
Run: `npm run ci`
Expected: PASS

- [ ] **Step 4: Commit with grep proof in message**
```bash
git add -A
git commit -m "chore: dead-code removal - EXCEL_TABS, createPanelConfigs, buildExcelPanels (grep verified)"
```

---

## Acceptance Gates (Every Phase)

- [ ] Failing-first: new assertions run red against pre-fix code
- [ ] Count proofs: `txCount === 1`, duplicate-row count `=== 0`, query-count bound
- [ ] Each phase lands as green commit series, separately revertible
- [ ] Report persisted as docs commit

---

## Execution Order

1. **Phase 1 — Containment (Tasks 1-5)**: P1 correctness fixes
2. **Phase 2 — Sync & List Hardening (Tasks 6-9)**: P1-8, P1-9, P2-1, P1-6
3. **Phase 3 — De-vibing & Debt (Tasks 10-14)**: P1-4, P2-2, P2-3, P3-1, P2-4

**Total: 14 tasks**