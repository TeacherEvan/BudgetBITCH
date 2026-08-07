/// <reference types="vite/client" />
/* eslint-disable @typescript-eslint/no-explicit-any */
//
// Guards the hard-delete contract of Settings -> "Reset All Data".
//
// Before `convex/purge.ts` shipped, the reset flow only called
// `snapshots.deleteAllUserSnapshots`, which wiped three tables. The user's
// private sharing profile, their owned accounts and — critically — the
// `accountBoards`/`sharedBoards` rows holding the FULL serialized financial
// board all survived on the server, so "delete everything" left a complete
// copy of the user's finances in the cloud.
//
// These tests pin the correct behaviour of `purge.purgeMyAccountData`: every
// user-owned table is emptied, co-members keep their own data, and the consent
// audit trail is deliberately retained.
import { convexTest } from "convex-test";
import { expect, test, beforeEach } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

let t: ReturnType<typeof convexTest>;
const asUser = (userId: any) => t.withIdentity({ subject: userId });

function seedUser(label: string) {
  return t.run(async (ctx: any) =>
    ctx.db.insert("users", { email: `${label}@example.com` }),
  ) as Promise<any>;
}

const snapshotArgs = {
  wizardProfile: { completed: true, locale: "en" },
  totals: { income: 50000, expenses: 10000, savings: 40000, netWorth: 100000 },
};

beforeEach(() => {
  t = convexTest(schema, modules);
});

test("purgeMyAccountData requires authentication", async () => {
  await expect(t.mutation(api.purge.purgeMyAccountData, {})).rejects.toThrow(
    /Authentication required/,
  );
});

test("purge deletes snapshots, receipts and merchant aliases", async () => {
  const alice = await seedUser("alice");
  await asUser(alice).mutation(api.snapshots.upsertDailySnapshot, snapshotArgs);

  await t.run(async (ctx: any) => {
    await ctx.db.insert("receipts", {
      userId: alice,
      amount: 420,
      merchant: "7-Eleven",
      category: "food",
      imageMimeType: "image/jpeg",
      imageSizeBytes: 1024,
      parsedAt: Date.now(),
      geminiModel: "gemini-2.5-flash",
    });
    await ctx.db.insert("merchantAliases", {
      userId: alice,
      normalised: "7eleven",
      displayName: "7-Eleven",
      category: "food",
      hits: 3,
      updatedAt: Date.now(),
    });
  });

  const res = await asUser(alice).mutation(api.purge.purgeMyAccountData, {});
  expect(res.success).toBe(true);
  expect(res.counts.snapshots).toBe(1);
  expect(res.counts.receipts).toBe(1);
  expect(res.counts.merchantAliases).toBe(1);

  const remaining = await t.run(async (ctx: any) => ({
    snapshots: await ctx.db.query("dailySnapshots").collect(),
    receipts: await ctx.db.query("receipts").collect(),
    aliases: await ctx.db.query("merchantAliases").collect(),
  }));
  expect(remaining.snapshots).toHaveLength(0);
  expect(remaining.receipts).toHaveLength(0);
  expect(remaining.aliases).toHaveLength(0);
});

test("purge destroys the user's private sharing profile", async () => {
  const alice = await seedUser("alice");
  await asUser(alice).mutation(api.sharedBoards.ensureProfile, {});

  const before = await t.run(async (ctx: any) =>
    ctx.db.query("userProfiles").collect(),
  );
  expect(before).toHaveLength(1);

  const res = await asUser(alice).mutation(api.purge.purgeMyAccountData, {});
  expect(res.counts.profiles).toBe(1);

  const after = await t.run(async (ctx: any) =>
    ctx.db.query("userProfiles").collect(),
  );
  expect(after).toHaveLength(0);
});

test("purge destroys an owned account, its board data, members and invites", async () => {
  const alice = await seedUser("alice");
  const bob = await seedUser("bob");

  const created = await asUser(alice).mutation(api.accounts.createAccount, {
    name: "Household",
    umbrella: "family",
  });

  // Bob joins, then the board is loaded with real financial data.
  const bobProfile = await asUser(bob).mutation(api.sharedBoards.ensureProfile, {});
  await asUser(alice).mutation(api.accounts.inviteByCode, {
    accountId: created.accountId,
    code: (bobProfile as any).shareCode,
  });
  const invites = await asUser(bob).query(api.accounts.listInvites, {});
  await asUser(bob).mutation(api.accounts.acceptInvite, {
    inviteId: invites[0].inviteId,
  });

  await asUser(alice).mutation(api.accounts.pushAccountBoard, {
    boardId: created.boardId,
    data: {
      "expenses:e1": { value: { id: "e1", amount: 9999 }, updatedAt: Date.now() },
    },
    updatedAt: Date.now(),
  });

  const seeded = await t.run(async (ctx: any) =>
    ctx.db.query("accountBoards").collect(),
  );
  expect(seeded).toHaveLength(1);
  expect(seeded[0].data["expenses:e1"].value.amount).toBe(9999);

  const res = await asUser(alice).mutation(api.purge.purgeMyAccountData, {});
  expect(res.counts.accounts).toBe(1);
  expect(res.counts.accountBoards).toBe(1);
  expect(res.counts.boardMemberships).toBeGreaterThanOrEqual(2);

  const after = await t.run(async (ctx: any) => ({
    accounts: await ctx.db.query("accounts").collect(),
    boards: await ctx.db.query("accountBoards").collect(),
    members: await ctx.db.query("boardMembers").collect(),
    invites: await ctx.db.query("invites").collect(),
  }));
  expect(after.accounts).toHaveLength(0);
  expect(after.boards).toHaveLength(0);
  expect(after.members).toHaveLength(0);
  expect(after.invites).toHaveLength(0);
});

test("purge by a JOINED member leaves the owner's board intact", async () => {
  const alice = await seedUser("alice");
  const bob = await seedUser("bob");

  const created = await asUser(alice).mutation(api.accounts.createAccount, {
    name: "Household",
    umbrella: "family",
  });
  const bobProfile = await asUser(bob).mutation(api.sharedBoards.ensureProfile, {});
  await asUser(alice).mutation(api.accounts.inviteByCode, {
    accountId: created.accountId,
    code: (bobProfile as any).shareCode,
  });
  const invites = await asUser(bob).query(api.accounts.listInvites, {});
  await asUser(bob).mutation(api.accounts.acceptInvite, {
    inviteId: invites[0].inviteId,
  });

  await asUser(bob).mutation(api.purge.purgeMyAccountData, {});

  const after = await t.run(async (ctx: any) => ({
    accounts: await ctx.db.query("accounts").collect(),
    boards: await ctx.db.query("accountBoards").collect(),
    members: await ctx.db.query("boardMembers").collect(),
  }));
  // Alice keeps her account and board...
  expect(after.accounts).toHaveLength(1);
  expect(after.boards).toHaveLength(1);
  // ...but Bob is no longer a member of it.
  expect(after.members.some((m: any) => m.userId === bob)).toBe(false);
  expect(after.boards[0].members).not.toContain(bob);
});

test("purge deletes the couple board when the partner is no longer linked", async () => {
  const alice = await seedUser("alice");
  const bob = await seedUser("bob");
  const aliceProfile = await asUser(alice).mutation(api.sharedBoards.ensureProfile, {});
  await asUser(bob).mutation(api.sharedBoards.ensureProfile, {});
  await asUser(bob).mutation(api.sharedBoards.linkByCode, {
    code: (aliceProfile as any).shareCode,
  });

  // Bob walks away first, so the board is orphaned when Alice resets.
  await asUser(bob).mutation(api.sharedBoards.unlink, {});

  const res = await asUser(alice).mutation(api.purge.purgeMyAccountData, {});
  expect(res.counts.sharedBoards).toBe(1);

  const boards = await t.run(async (ctx: any) =>
    ctx.db.query("sharedBoards").collect(),
  );
  expect(boards).toHaveLength(0);
});

test("purge keeps the couple board when the partner is still linked", async () => {
  const alice = await seedUser("alice");
  const bob = await seedUser("bob");
  const aliceProfile = await asUser(alice).mutation(api.sharedBoards.ensureProfile, {});
  await asUser(bob).mutation(api.sharedBoards.ensureProfile, {});
  await asUser(bob).mutation(api.sharedBoards.linkByCode, {
    code: (aliceProfile as any).shareCode,
  });

  const res = await asUser(alice).mutation(api.purge.purgeMyAccountData, {});
  expect(res.counts.sharedBoards).toBe(0);

  const boards = await t.run(async (ctx: any) =>
    ctx.db.query("sharedBoards").collect(),
  );
  expect(boards).toHaveLength(1);
});

test("purge removes push subscriptions and the LINE identity binding", async () => {
  const alice = await seedUser("alice");
  await t.run(async (ctx: any) => {
    await ctx.db.insert("pushSubscriptions", {
      userId: alice,
      endpoint: "https://push.example/abc",
      subscription: {
        endpoint: "https://push.example/abc",
        keys: { p256dh: "p", auth: "a" },
      },
      updatedAt: Date.now(),
    });
    await ctx.db.insert("lineUsers", {
      lineUserId: "U-line-1",
      userId: alice,
      linkedAt: Date.now(),
    });
  });

  const res = await asUser(alice).mutation(api.purge.purgeMyAccountData, {});
  expect(res.counts.pushSubscriptions).toBe(1);
  expect(res.counts.lineIdentities).toBe(1);

  const after = await t.run(async (ctx: any) => ({
    subs: await ctx.db.query("pushSubscriptions").collect(),
    line: await ctx.db.query("lineUsers").collect(),
  }));
  expect(after.subs).toHaveLength(0);
  expect(after.line).toHaveLength(0);
});

test("purge removes pendingDeletes (they embed snapshots of financial rows)", async () => {
  const alice = await seedUser("alice");
  const bob = await seedUser("bob");
  const aliceProfile = await asUser(alice).mutation(api.sharedBoards.ensureProfile, {});
  await asUser(bob).mutation(api.sharedBoards.ensureProfile, {});
  const boardId = await asUser(bob).mutation(api.sharedBoards.linkByCode, {
    code: (aliceProfile as any).shareCode,
  });

  await t.run(async (ctx: any) => {
    await ctx.db.insert("pendingDeletes", {
      boardId,
      store: "expenses",
      itemId: "e1",
      requestedBy: alice,
      requestedAt: Date.now(),
      status: "pending",
      itemSnapshot: { id: "e1", amount: 1234 },
    });
  });

  const res = await asUser(alice).mutation(api.purge.purgeMyAccountData, {});
  expect(res.counts.pendingDeletes).toBeGreaterThanOrEqual(1);

  const rows = await t.run(async (ctx: any) =>
    ctx.db.query("pendingDeletes").collect(),
  );
  expect(rows).toHaveLength(0);
});

test("purge retains the legal consent audit trail by design", async () => {
  const alice = await seedUser("alice");
  await asUser(alice).mutation(api.legal.recordAgreement, {
    termsVersion: "1.0",
    privacyVersion: "1.0",
  });

  await asUser(alice).mutation(api.purge.purgeMyAccountData, {});

  const agreements = await t.run(async (ctx: any) =>
    ctx.db.query("legalAgreements").collect(),
  );
  expect(agreements).toHaveLength(1);
});

test("purge does not touch another user's data", async () => {
  const alice = await seedUser("alice");
  const bob = await seedUser("bob");
  await asUser(alice).mutation(api.snapshots.upsertDailySnapshot, snapshotArgs);
  await asUser(bob).mutation(api.snapshots.upsertDailySnapshot, snapshotArgs);
  await asUser(bob).mutation(api.sharedBoards.ensureProfile, {});

  await asUser(alice).mutation(api.purge.purgeMyAccountData, {});

  const after = await t.run(async (ctx: any) => ({
    snapshots: await ctx.db.query("dailySnapshots").collect(),
    profiles: await ctx.db.query("userProfiles").collect(),
  }));
  expect(after.snapshots).toHaveLength(1);
  expect(after.snapshots[0].userId).toBe(bob);
  expect(after.profiles).toHaveLength(1);
  expect(after.profiles[0].userId).toBe(bob);
});

test("purge is idempotent — a second call succeeds with zero counts", async () => {
  const alice = await seedUser("alice");
  await asUser(alice).mutation(api.snapshots.upsertDailySnapshot, snapshotArgs);

  await asUser(alice).mutation(api.purge.purgeMyAccountData, {});
  const second = await asUser(alice).mutation(api.purge.purgeMyAccountData, {});

  expect(second.success).toBe(true);
  expect(second.counts.snapshots).toBe(0);
  expect(second.counts.profiles).toBe(0);
  expect(second.counts.accounts).toBe(0);
});
