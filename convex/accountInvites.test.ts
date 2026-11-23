/// <reference types="vite/client" />
/* eslint-disable @typescript-eslint/no-explicit-any */
import { convexTest } from "convex-test";
import { expect, test, beforeEach, describe } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

function seedUser(t: ReturnType<typeof convexTest>, label: string) {
  return t.run(async (ctx: any) =>
    ctx.db.insert("users", { email: `${label}@example.com` }),
  ) as Promise<any>;
}

let t: ReturnType<typeof convexTest>;
const asUser = (userId: any) => t.withIdentity({ subject: userId });

beforeEach(() => {
  t = convexTest(schema, modules);
});

async function makeProfile(
  userId: any,
  shareCode: string,
  extra: Record<string, any> = {},
) {
  return t.run(async (ctx: any) =>
    ctx.db.insert("userProfiles", { userId, shareCode, ...extra }),
  );
}

async function createAccount(
  ownerId: any,
  umbrella: string,
  name: string,
) {
  return asUser(ownerId).mutation(api.accounts.createAccount, {
    umbrella,
    name,
  }) as Promise<{ accountId: string; boardId: string; inviteCode: string }>;
}

describe("accountInvites edge cases", () => {
  test("declineInvite throws if invite status is not 'pending'", async () => {
    const aliceId = await seedUser(t, "alice");
    const bobId = await seedUser(t, "bob");
    const { accountId, boardId } = await createAccount(aliceId, "family", "Fam");
    await makeProfile(bobId, "BOB12345");
    await asUser(aliceId).mutation(api.accounts.inviteByCode, {
      accountId,
      code: "BOB12345",
    });
    const invites = await asUser(bobId).query(api.accounts.listInvites, {});
    const inviteId = invites[0].inviteId;

    // First accept the invite
    await asUser(bobId).mutation(api.accounts.acceptInvite, { inviteId });

    // Now try to decline - should throw
    await expect(
      asUser(bobId).mutation(api.accounts.declineInvite, { inviteId }),
    ).rejects.toThrow(/Invite already handled/);
  });

  test("acceptInvite concurrent race - exactly MAX_MEMBERS rows", async () => {
    const aliceId = await seedUser(t, "alice");
    const { accountId, boardId } = await createAccount(aliceId, "family", "Fam");

    // Create MAX_MEMBERS - 1 other users (owner + 7 = 8 = MAX_MEMBERS)
    const otherUsers: any[] = [];
    for (let i = 0; i < 7; i++) {
      const id = await seedUser(t, `user${i}`);
      otherUsers.push(id);
      await makeProfile(id, `USER${i}XXXX`.slice(0, 8));
      await asUser(aliceId).mutation(api.accounts.inviteByCode, {
        accountId,
        code: `USER${i}XXXX`.slice(0, 8),
      });
    }

    // Get all invites
    const allInvites: any[] = [];
    for (const userId of otherUsers) {
      const invites = await asUser(userId).query(api.accounts.listInvites, {});
      allInvites.push({ userId, inviteId: invites[0].inviteId });
    }

    // All 7 try to accept concurrently - all should succeed (fills to MAX_MEMBERS)
    const results = await Promise.all(
      allInvites.map(({ userId, inviteId }) =>
        asUser(userId).mutation(api.accounts.acceptInvite, { inviteId })
      )
    );

    // All should succeed
    for (const res of results) {
      expect(res.success).toBe(true);
    }

    // Verify exactly MAX_MEMBERS members
    const memberRows = await t.run(async (ctx: any) =>
      ctx.db
        .query("boardMembers")
        .withIndex("by_board", (q: any) => q.eq("boardId", boardId))
        .collect(),
    );
    expect(memberRows.length).toBe(8); // MAX_MEMBERS = 8
  });

  test("acceptInvite third member (over cap) throws and rolls back", async () => {
    const aliceId = await seedUser(t, "alice");
    const { accountId, boardId } = await createAccount(aliceId, "family", "Fam");

    // Create MAX_MEMBERS - 1 = 7 other users (fills to cap when they accept)
    const otherUsers: any[] = [];
    for (let i = 0; i < 7; i++) {
      const id = await seedUser(t, `user${i}`);
      otherUsers.push(id);
      await makeProfile(id, `USER${i}XXXX`.slice(0, 8));
      await asUser(aliceId).mutation(api.accounts.inviteByCode, {
        accountId,
        code: `USER${i}XXXX`.slice(0, 8),
      });
    }

    // Create an 8th user and manually insert an invite (bypassing the cap check in inviteByCode)
    const extraUser = await seedUser(t, "extra");
    await makeProfile(extraUser, "EXTRA9999");
    
    // Insert invite directly to bypass the cap check
    await t.run(async (ctx: any) => {
      const acc = await ctx.db
        .query("accounts")
        .withIndex("by_accountId", (q: any) => q.eq("accountId", accountId))
        .unique();
      await ctx.db.insert("invites", {
        boardId: acc!.boardId,
        fromUserId: aliceId,
        toUserId: extraUser,
        status: "pending",
        createdAt: Date.now(),
        accountId: accountId,
      });
    });

    // Get all invites
    const allInvites: any[] = [];
    for (const userId of otherUsers) {
      const invites = await asUser(userId).query(api.accounts.listInvites, {});
      allInvites.push({ userId, inviteId: invites[0].inviteId });
    }
    const extraInvites = await asUser(extraUser).query(api.accounts.listInvites, {});
    allInvites.push({ userId: extraUser, inviteId: extraInvites[0].inviteId });

    // First 7 accept - fills to cap (owner + 7 = 8 = MAX_MEMBERS)
    for (const { userId, inviteId } of allInvites.slice(0, 7)) {
      await asUser(userId).mutation(api.accounts.acceptInvite, { inviteId });
    }

    // 8th tries to accept - should throw (over cap)
    const lastInvite = allInvites[7];
    await expect(
      asUser(lastInvite.userId).mutation(api.accounts.acceptInvite, { inviteId: lastInvite.inviteId }),
    ).rejects.toThrow(/at most 8 members/);

    // Verify still exactly MAX_MEMBERS members
    const memberRows = await t.run(async (ctx: any) =>
      ctx.db
        .query("boardMembers")
        .withIndex("by_board", (q: any) => q.eq("boardId", boardId))
        .collect(),
    );
    expect(memberRows.length).toBe(8); // MAX_MEMBERS = 8
  });

  test("redeemInviteToken rolls back if board exceeds MAX_MEMBERS", async () => {
    const aliceId = await seedUser(t, "alice");
    const { accountId, boardId } = await createAccount(aliceId, "family", "Fam");

    // Create 7 other users to fill up to MAX_MEMBERS (8)
    for (let i = 0; i < 7; i++) {
      const id = await seedUser(t, `member${i}`);
      await makeProfile(id, `MEM${i}XXXX`.slice(0, 8));
      await asUser(aliceId).mutation(api.accounts.inviteByCode, {
        accountId,
        code: `MEM${i}XXXX`.slice(0, 8),
      });
      const invites = await asUser(id).query(api.accounts.listInvites, {});
      await asUser(id).mutation(api.accounts.acceptInvite, { inviteId: invites[0].inviteId });
    }

    // Now board has 8 members (owner + 7)
    // Manually insert an invite token for the account
    const token = "invite-token-test";
    await t.run(async (ctx: any) => {
      await ctx.db.insert("invites", {
        boardId,
        fromUserId: aliceId,
        toUserId: undefined,
        status: "pending",
        createdAt: Date.now(),
        accountId,
        token,
      });
    });

    const extraUser = await seedUser(t, "extra_redeem_user");
    await expect(
      asUser(extraUser).mutation(api.accounts.redeemInviteToken, { token }),
    ).rejects.toThrow(/at most 8 members/);

    const memberRows = await t.run(async (ctx: any) =>
      ctx.db
        .query("boardMembers")
        .withIndex("by_board", (q: any) => q.eq("boardId", boardId))
        .collect(),
    );
    expect(memberRows.length).toBe(8);
  });
});

describe("pendingDeletes consent matrix", () => {
  test("third member cannot approve - only the OTHER member can", async () => {
    const aliceId = await seedUser(t, "alice");
    const bobId = await seedUser(t, "bob");
    const carolId = await seedUser(t, "carol");

    // Create an account board with 3 members
    const { accountId, boardId } = await createAccount(aliceId, "family", "Fam");
    await makeProfile(bobId, "BOB12345");
    await makeProfile(carolId, "CAROL123");
    
    await asUser(aliceId).mutation(api.accounts.inviteByCode, {
      accountId,
      code: "BOB12345",
    });
    await asUser(aliceId).mutation(api.accounts.inviteByCode, {
      accountId,
      code: "CAROL123",
    });

    const bobInvites = await asUser(bobId).query(api.accounts.listInvites, {});
    await asUser(bobId).mutation(api.accounts.acceptInvite, { inviteId: bobInvites[0].inviteId });

    const carolInvites = await asUser(carolId).query(api.accounts.listInvites, {});
    await asUser(carolId).mutation(api.accounts.acceptInvite, { inviteId: carolInvites[0].inviteId });

    // Alice requests a delete
    const { pendingId } = await asUser(aliceId).mutation(api.pendingDeletes.requestItemDelete, {
      boardId,
      store: "expenses",
      itemId: "e1",
    });

    // Carol (third member, not the other member for Alice's request) tries to approve - should throw
    // For accountBoards, otherMemberId returns the FIRST other member
    // Alice requested, so other members are Bob and Carol - first other is Bob
    // Carol should NOT be able to approve
    await expect(
      asUser(carolId).mutation(api.pendingDeletes.approveItemDelete, { pendingId }),
    ).rejects.toThrow(/Only the other board member can approve/);

    // Verify listPendingDeletes sets canAct accurately based on otherMemberId
    const aliceView = await asUser(aliceId).query(api.pendingDeletes.listPendingDeletes, { boardId });
    expect(aliceView[0].canAct).toBe(false);
    expect(aliceView[0].isRequester).toBe(true);

    const bobView = await asUser(bobId).query(api.pendingDeletes.listPendingDeletes, { boardId });
    expect(bobView[0].canAct).toBe(true);
    expect(bobView[0].isRequester).toBe(false);

    const carolView = await asUser(carolId).query(api.pendingDeletes.listPendingDeletes, { boardId });
    expect(carolView[0].canAct).toBe(false);
    expect(carolView[0].isRequester).toBe(false);

    // Bob (the first other member) should be able to approve
    const res = await asUser(bobId).mutation(api.pendingDeletes.approveItemDelete, { pendingId });
    expect(res.approved).toBe(true);
  });

  test("requester can cancel their own pending request via rejectItemDelete", async () => {
    const aliceId = await seedUser(t, "alice");
    const bobId = await seedUser(t, "bob");
    const { accountId, boardId } = await createAccount(aliceId, "family", "Fam");
    await makeProfile(bobId, "BOB12345");
    
    await asUser(aliceId).mutation(api.accounts.inviteByCode, {
      accountId,
      code: "BOB12345",
    });
    const bobInvites = await asUser(bobId).query(api.accounts.listInvites, {});
    await asUser(bobId).mutation(api.accounts.acceptInvite, { inviteId: bobInvites[0].inviteId });

    // Alice requests a delete
    const { pendingId } = await asUser(aliceId).mutation(api.pendingDeletes.requestItemDelete, {
      boardId,
      store: "expenses",
      itemId: "e1",
    });

    // Alice (requester) can cancel via rejectItemDelete
    const res = await asUser(aliceId).mutation(api.pendingDeletes.rejectItemDelete, { pendingId });
    expect(res.rejected).toBe(true);

    const rows = await t.run(async (ctx: any) => 
      ctx.db.query("pendingDeletes").withIndex("by_board_status", (q: any) => q.eq("boardId", boardId).eq("status", "rejected")).collect()
    );
    expect(rows[0].status).toBe("rejected");
  });
});

// W3 audit regressions: invite TTL, token burning, cap scan, and member revocation.
describe("W3 invite lifecycle hardening", () => {
  const EIGHT_DAYS_MS = 8 * 24 * 60 * 60 * 1000;

  test("redeemInviteToken rejects a pending token older than 7 days and marks it expired", async () => {
    const aliceId = await seedUser(t, "alice");
    const bobId = await seedUser(t, "bob");
    const { accountId } = await createAccount(aliceId, "family", "Fam");
    const { token } = await asUser(aliceId).mutation(api.accounts.createInviteToken, {
      accountId,
    });

    await t.run(async (ctx: any) => {
      const row = await ctx.db
        .query("invites")
        .withIndex("by_token", (q: any) => q.eq("token", token))
        .unique();
      await ctx.db.patch(row._id, { createdAt: Date.now() - EIGHT_DAYS_MS });
    });

    await expect(
      asUser(bobId).mutation(api.accounts.redeemInviteToken, { token }),
    ).rejects.toThrow(/invalid or expired/);

    // A throwing Convex mutation rolls back its writes, so the TTL is enforced
    // on every redemption. The next invite operation sweeps the stale row to
    // "expired" and persists it.
    await asUser(aliceId).mutation(api.accounts.createInviteToken, { accountId });
    const expired = await t.run(async (ctx: any) =>
      ctx.db
        .query("invites")
        .withIndex("by_token", (q: any) => q.eq("token", token))
        .unique(),
    );
    expect(expired.status).toBe("expired");
  });

  test("redeemInviteToken by an existing member does not burn a token meant for someone else", async () => {
    const aliceId = await seedUser(t, "alice");
    const bobId = await seedUser(t, "bob");
    const carolId = await seedUser(t, "carol");
    const { accountId } = await createAccount(aliceId, "family", "Fam");

    await makeProfile(bobId, "BOB12345");
    await asUser(aliceId).mutation(api.accounts.inviteByCode, {
      accountId,
      code: "BOB12345",
    });
    const bobInvites = await asUser(bobId).query(api.accounts.listInvites, {});
    await asUser(bobId).mutation(api.accounts.acceptInvite, {
      inviteId: bobInvites[0].inviteId,
    });

    const { token } = await asUser(aliceId).mutation(api.accounts.createInviteToken, {
      accountId,
    });

    // Bob is already a member. He may be told so, but the token must stay usable.
    const memberResult = await asUser(bobId).mutation(api.accounts.redeemInviteToken, {
      token,
    });
    expect(memberResult.alreadyMember).toBe(true);

    const stillPending = await t.run(async (ctx: any) =>
      ctx.db
        .query("invites")
        .withIndex("by_token", (q: any) => q.eq("token", token))
        .unique(),
    );
    expect(stillPending.status).toBe("pending");

    // The intended joiner can still redeem the very same token.
    const joinResult = await asUser(carolId).mutation(api.accounts.redeemInviteToken, {
      token,
    });
    expect(joinResult.alreadyMember).toBe(false);
  });

  test("createInviteToken counts pending invites beyond the oldest 16 rows", async () => {
    const aliceId = await seedUser(t, "alice");
    const { accountId } = await createAccount(aliceId, "family", "Fam");

    await t.run(async (ctx: any) => {
      const acc = await ctx.db
        .query("accounts")
        .withIndex("by_accountId", (q: any) => q.eq("accountId", accountId))
        .unique();
      // 20 OLD terminal rows crowd out the oldest-16 scan window.
      for (let i = 0; i < 20; i++) {
        await ctx.db.insert("invites", {
          boardId: acc.boardId,
          fromUserId: aliceId,
          status: i % 2 === 0 ? "accepted" : "declined",
          createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000 - i * 1000,
          accountId,
        });
      }
      // 7 still-pending token invites fill the cap (owner + 7 = MAX_MEMBERS).
      for (let i = 0; i < 7; i++) {
        await ctx.db.insert("invites", {
          boardId: acc.boardId,
          fromUserId: aliceId,
          status: "pending",
          createdAt: Date.now() - i * 1000,
          accountId,
          token: `w3-pending-token-${i}`,
        });
      }
    });

    await expect(
      asUser(aliceId).mutation(api.accounts.createInviteToken, { accountId }),
    ).rejects.toThrow(/at most 8 members/);
  });

  test("removeMember cancels outstanding invites so a removed member cannot rejoin with a token", async () => {
    const aliceId = await seedUser(t, "alice");
    const bobId = await seedUser(t, "bob");
    const { accountId } = await createAccount(aliceId, "family", "Fam");

    await makeProfile(bobId, "BOB12345");
    await asUser(aliceId).mutation(api.accounts.inviteByCode, {
      accountId,
      code: "BOB12345",
    });
    const bobInvites = await asUser(bobId).query(api.accounts.listInvites, {});
    await asUser(bobId).mutation(api.accounts.acceptInvite, {
      inviteId: bobInvites[0].inviteId,
    });
    // A still-pending bearer token that the departing member could reuse.
    const { token } = await asUser(aliceId).mutation(api.accounts.createInviteToken, {
      accountId,
    });

    await asUser(aliceId).mutation(api.accounts.removeMember, {
      accountId,
      userId: bobId,
    });

    await expect(
      asUser(bobId).mutation(api.accounts.redeemInviteToken, { token }),
    ).rejects.toThrow(/invalid or expired/);
  });

  test("leaveAccount cancels outstanding invites so a departing member cannot rejoin", async () => {
    const aliceId = await seedUser(t, "alice");
    const bobId = await seedUser(t, "bob");
    const { accountId } = await createAccount(aliceId, "family", "Fam");

    await makeProfile(bobId, "BOB12345");
    await asUser(aliceId).mutation(api.accounts.inviteByCode, {
      accountId,
      code: "BOB12345",
    });
    const bobInvites = await asUser(bobId).query(api.accounts.listInvites, {});
    await asUser(bobId).mutation(api.accounts.acceptInvite, {
      inviteId: bobInvites[0].inviteId,
    });
    const { token } = await asUser(aliceId).mutation(api.accounts.createInviteToken, {
      accountId,
    });

    await asUser(bobId).mutation(api.accounts.leaveAccount, { accountId });

    await expect(
      asUser(bobId).mutation(api.accounts.redeemInviteToken, { token }),
    ).rejects.toThrow(/invalid or expired/);
  });

  test("removeMember rejects a malformed user id", async () => {
    const aliceId = await seedUser(t, "alice");
    const { accountId } = await createAccount(aliceId, "family", "Fam");

    await expect(
      asUser(aliceId).mutation(api.accounts.removeMember, {
        accountId,
        userId: "not-a-valid-user-id" as any,
      }),
    ).rejects.toThrow();
  });
});