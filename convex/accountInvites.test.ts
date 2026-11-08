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